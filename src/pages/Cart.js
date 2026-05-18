import Navbar from "../components/Navbar";
import { useCart } from "../CartContext";
import { usePageTransition } from "../App";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { useLang } from "../LanguageContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const customerIcon = L.divIcon({
  className: "customer-location-marker",
  html: "📍",
  iconSize: [34, 34],
  iconAnchor: [17, 34]
});

function LocationPicker({ customerLocation, setCustomerLocation, resetDelivery }) {
  useMapEvents({
    click(e) {
      setCustomerLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
      resetDelivery();
    }
  });

  return customerLocation ? (
    <Marker
      position={[customerLocation.lat, customerLocation.lng]}
      icon={customerIcon}
    />
  ) : null;
}

export default function Cart() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    total
  } = useCart();

  const { goWithFlash } = usePageTransition();
  const { t } = useLang();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [customerLocation, setCustomerLocation] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);

  const [loadingOrder, setLoadingOrder] = useState(false);

  const storeLocation = {
    lat: 31.729194,
    lng: 35.243556
  };

  const API_BASE = (
    process.env.REACT_APP_WASLNI_API_URL || "http://localhost:5000/orders"
  ).replace(/\/orders$/, "");

  const finalTotal = Number(total || 0) + Number(deliveryFee || 0);
  const itemsCount = cart.length;

  const resetDelivery = () => {
    setDeliveryFee(null);
    setDeliveryDistance(null);
  };

  const getErrorMessage = (message) => {
    if (message === "Delivery is available only inside Jerusalem") {
      return t.deliveryOnlyJerusalem;
    }

    if (
      message === "Customer location is required" ||
      message === "Valid customer location is required"
    ) {
      return t.locationRequired;
    }

    return message || t.orderPlaceFailed;
  };

  const getUnitLabel = (unit) => {
    return unit === "kg" ? t.kg : t.piece;
  };

  const formatQuantity = (quantity, unit) => {
    return unit === "kg" ? Number(quantity).toFixed(3) : quantity;
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t.locationNotSupported);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });

        resetDelivery();
        toast.success(t.locationSelected);
      },
      () => {
        toast.error(t.locationAccessFailed);
      }
    );
  };

  const calculateDeliveryPrice = async () => {
    if (!customerLocation) {
      toast.error(t.locationRequired);
      return;
    }

    try {
      setCalculatingDelivery(true);

      const response = await fetch(`${API_BASE}/delivery-price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerLat: customerLocation.lat,
          customerLng: customerLocation.lng,
          items: cart,
          productsTotal: total
        })
      });

      const data = await response.json();

      if (!response.ok) {
        resetDelivery();
        toast.error(getErrorMessage(data.error));
        return;
      }

      setDeliveryFee(Number(data.deliveryFee || data.price || 0));
      setDeliveryDistance(data.distanceKm || null);
    } catch (error) {
      console.error(error);
      resetDelivery();
      toast.error(t.deliveryCalculationFailed);
    } finally {
      setCalculatingDelivery(false);
    }
  };

  useEffect(() => {
    if (!checkoutOpen) return;
    if (!customerLocation) return;

    const timer = setTimeout(() => {
      calculateDeliveryPrice();
    }, 700);

    return () => clearTimeout(timer);
  }, [checkoutOpen, customerLocation, total]);, [
    checkoutOpen,
    customerName,
    customerPhone,
    customerAddress,
    customerLocation,
    total
  ]);

  const placeOrder = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error(t.requiredFields);
      return;
    }

    if (!customerLocation) {
      toast.error(t.locationRequired);
      return;
    }

    if (calculatingDelivery) {
      toast.error(t.calculationInProgress);
      return;
    }

    if (deliveryFee === null) {
      toast.error(t.calculateDeliveryFirst);
      return;
    }

    try {
      setLoadingOrder(true);

      const localOrderId =
        "ROSA-" + Math.floor(100000 + Math.random() * 900000);

      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerNote,
          customerLat: customerLocation.lat,
          customerLng: customerLocation.lng,
          items: cart,
          productsTotal: total,
          deliveryFee,
          total: finalTotal
        })
      });

      const waslniResult = await response.json();

      const orderData = {
        orderNumber: localOrderId,
        customerName,
        customerPhone,
        customerAddress,
        customerNote,
        customerLat: customerLocation.lat,
        customerLng: customerLocation.lng,
        items: cart,
        productsTotal: total,
        deliveryFee,
        total: finalTotal,
        status: "pending",
        waslniSuccess: response.ok,
        waslniResponse: waslniResult,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "orders"), orderData);

      if (!response.ok) {
        toast.error(getErrorMessage(waslniResult.error));
        return;
      }

      toast.success(`${t.orderSuccess} - ${localOrderId}`);

      clearCart();
      setCheckoutOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerNote("");
      setCustomerLocation(null);
      resetDelivery();
    } catch (error) {
      console.error(error);
      toast.error(t.orderPlaceFailed);
    } finally {
      setLoadingOrder(false);
    }
  };

  return (
    <div className="container">
      <Navbar />

      <h2 className="page-title">{t.shoppingCart}</h2>

      {cart.length === 0 ? (
        <div className="empty-card glass">
          <div className="empty-icon">🛒</div>
          <h3>{t.emptyCartTitle}</h3>
          <p>{t.emptyCartDesc}</p>

          <button onClick={() => goWithFlash("/")}>
            {t.backToHome}
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="glass cart-card">
                <img src={item.image} alt={item.name} />

                <div className="cart-info">
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>

                  <div className="cart-price">
                    ₪ {item.price} / {getUnitLabel(item.unit)}
                  </div>

                  <div className="cart-bottom">
                    <div className="cart-controls">
                      <button onClick={() => decreaseQuantity(item.id)}>
                        −
                      </button>

                      <span>
                        {formatQuantity(item.quantity, item.unit)}{" "}
                        {getUnitLabel(item.unit)}
                      </span>

                      <button onClick={() => increaseQuantity(item.id)}>
                        +
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      {t.remove}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass cart-summary">
            <h3>{t.orderSummary}</h3>

            <div className="summary-row">
              <span>{t.items}</span>
              <strong>{itemsCount}</strong>
            </div>

            <div className="summary-row total-row">
              <span>{t.productsTotal}</span>
              <strong>₪ {total.toFixed(2)}</strong>
            </div>

            <button
              className="place-order-btn"
              onClick={() => setCheckoutOpen(true)}
            >
              {t.calculateDeliveryCheckout}
            </button>

            <button className="clear-cart-btn" onClick={clearCart}>
              {t.clearCart}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {checkoutOpen && (
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCheckoutOpen(false)}
          >
            <motion.div
              className="glass checkout-modal"
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 20
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="checkout-close"
                onClick={() => setCheckoutOpen(false)}
              >
                ×
              </button>

              <div className="checkout-header">
                <div className="checkout-icon">🛍️</div>
                <h2>{t.completeOrder}</h2>
                <p>{t.enterDeliveryLocation}</p>
              </div>

              <div className="checkout-form">
                <input
                  placeholder={t.yourName}
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    resetDelivery();
                  }}
                />

                <input
                  placeholder={t.phoneNumber}
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    resetDelivery();
                  }}
                />

                <textarea
                  placeholder={t.deliveryAddress}
                  value={customerAddress}
                  onChange={(e) => {
                    setCustomerAddress(e.target.value);
                    resetDelivery();
                  }}
                />

                <button
                  type="button"
                  className="place-order-btn"
                  onClick={useMyLocation}
                >
                  {t.useCurrentLocation}
                </button>

                <div className="delivery-map-box">
                  <MapContainer
                    center={[storeLocation.lat, storeLocation.lng]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="delivery-map"
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker
                      position={[storeLocation.lat, storeLocation.lng]}
                      icon={L.divIcon({
                        className: "store-location-marker",
                        html: "🏪",
                        iconSize: [34, 34],
                        iconAnchor: [17, 34]
                      })}
                    />

                    <LocationPicker
                      customerLocation={customerLocation}
                      setCustomerLocation={setCustomerLocation}
                      resetDelivery={resetDelivery}
                    />
                  </MapContainer>
                </div>

                {customerLocation && (
                  <p style={{ fontSize: "14px", opacity: 0.8 }}>
                    {t.selectedLocation}: {customerLocation.lat.toFixed(5)},{" "}
                    {customerLocation.lng.toFixed(5)}
                  </p>
                )}

                <textarea
                  placeholder={t.notes}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                />
              </div>

              <div className="checkout-summary">
                <div>
                  <span>{t.productsTotal}</span>
                  <strong>₪ {total.toFixed(2)}</strong>
                </div>

                <div>
                  <span>{t.deliveryFee}</span>
                  <strong>
                    {calculatingDelivery
                      ? t.calculating
                      : deliveryFee === null
                        ? t.notCalculated
                        : `₪ ${deliveryFee}`}
                  </strong>
                </div>

                {deliveryDistance && (
                  <div>
                    <span>{t.distance}</span>
                    <strong>{deliveryDistance} km</strong>
                  </div>
                )}

                <div>
                  <span>{t.finalTotal}</span>
                  <strong>₪ {finalTotal.toFixed(2)}</strong>
                </div>
              </div>

              <button
                className="confirm-order-btn"
                onClick={placeOrder}
                disabled={loadingOrder || calculatingDelivery || deliveryFee === null}
              >
                {loadingOrder ? t.sending : t.confirmOrder}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}