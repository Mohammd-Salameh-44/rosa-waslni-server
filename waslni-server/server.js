const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://roseflower-b35d1.web.app"
    ],
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

const API_BASE = process.env.WASLNI_API_URL;
const PUBLIC_KEY = process.env.WASLNI_PUBLIC_KEY;
const SECRET_KEY = process.env.WASLNI_SECRET_KEY;

function signRequest(method, path, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = body ? JSON.stringify(body) : "";

  const bodyHash = crypto
    .createHash("sha256")
    .update(rawBody)
    .digest("hex");

  const stringToSign = `${timestamp}\n${method.toUpperCase()}\n${path}\n${bodyHash}`;

  const hmacKey = crypto
    .createHash("sha256")
    .update(SECRET_KEY)
    .digest("hex");

  const signature = crypto
    .createHmac("sha256", hmacKey)
    .update(stringToSign)
    .digest("hex");

  return { timestamp, signature, rawBody };
}

function isValidLocation(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function extractQuote(data) {
  return data?.quote || data?.data || data;
}

async function requestWaslni(path, body) {
  const { timestamp, signature, rawBody } = signRequest("POST", path, body);

  const url = `${API_BASE}${path.replace("/api/v2/external", "")}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": PUBLIC_KEY,
      "x-timestamp": timestamp,
      "x-signature": signature,
      "x-idempotency-key": crypto.randomUUID(),
      "content-type": "application/json"
    },
    body: rawBody
  });

  const data = await response.json();

  return {
    response,
    data
  };
}

async function createQuote(customerLat, customerLng) {
  const path = "/api/v2/external/orders/quote";

  const quoteBody = {
    deliveryAddress: {
      lat: customerLat,
      lng: customerLng
    }
  };

  const { response, data } = await requestWaslni(path, quoteBody);

  console.log("WASLNI QUOTE STATUS:", response.status);
  console.log("WASLNI QUOTE RESPONSE:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data
    };
  }

  const quote = extractQuote(data);

  return {
    ok: true,
    status: response.status,
    data,
    deliveryFee: Number(quote.deliveryFee || quote.price || quote.totalPrice || 0),
    distanceKm: quote.distanceKm || quote.distance || null,
    estimatedDeliveryTime: quote.estimatedDeliveryTime || null,
    currency: quote.currency || "ILS",
    quoteExpiresAt: quote.quoteExpiresAt || quote.expiresAt || null
  };
}

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Waslni server is running"
  });
});

app.post("/delivery-price", async (req, res) => {
  try {
    const customerLat = Number(req.body.customerLat);
    const customerLng = Number(req.body.customerLng);

    if (!isValidLocation(customerLat, customerLng)) {
      return res.status(400).json({
        ok: false,
        error: "Valid customer location is required"
      });
    }

    const quoteResult = await createQuote(customerLat, customerLng);

    if (!quoteResult.ok) {
      return res.status(quoteResult.status).json(quoteResult.data);
    }

    return res.json({
      ok: true,
      deliveryFee: quoteResult.deliveryFee,
      distanceKm: quoteResult.distanceKm,
      estimatedDeliveryTime: quoteResult.estimatedDeliveryTime,
      currency: quoteResult.currency,
      quoteExpiresAt: quoteResult.quoteExpiresAt,
      waslniResponse: quoteResult.data
    });
  } catch (error) {
    console.error("Delivery price error:", error);

    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const customerLat = Number(req.body.customerLat);
    const customerLng = Number(req.body.customerLng);

    if (!isNonEmptyString(req.body.customerName)) {
      return res.status(400).json({
        ok: false,
        error: "Customer name is required"
      });
    }

    if (!isNonEmptyString(req.body.customerPhone)) {
      return res.status(400).json({
        ok: false,
        error: "Customer phone is required"
      });
    }

    if (!isNonEmptyString(req.body.customerAddress)) {
      return res.status(400).json({
        ok: false,
        error: "Customer address is required"
      });
    }

    if (!isValidLocation(customerLat, customerLng)) {
      return res.status(400).json({
        ok: false,
        error: "Valid customer location is required"
      });
    }

    const orderBody = {
      customerName: req.body.customerName.trim(),
      customerPhone: req.body.customerPhone.trim(),

      deliveryAddress: {
        address: req.body.customerAddress.trim(),
        lat: customerLat,
        lng: customerLng
      },

      packageNote: req.body.customerNote || "",

      prepaidAmount: 0,

      deliveryNotes: `ROSA products: ₪${req.body.productsTotal || 0}, delivery: ₪${req.body.deliveryFee || 0}, total: ₪${req.body.total || 0}`,

      referenceId: `ROSA-${Date.now()}`
    };

    console.log("===== DATA RECEIVED FROM WEBSITE =====");
    console.log(JSON.stringify(req.body, null, 2));

    console.log("===== DATA SENT TO WASLNI ORDER =====");
    console.log(JSON.stringify(orderBody, null, 2));

    const path = "/api/v2/external/orders";

    const { response, data } = await requestWaslni(path, orderBody);

    console.log("WASLNI ORDER STATUS:", response.status);
    console.log("WASLNI ORDER RESPONSE:", JSON.stringify(data, null, 2));

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Route not found"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Waslni server running on port ${PORT}`);
});