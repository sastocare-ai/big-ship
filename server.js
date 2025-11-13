const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const BIGSHIP_API_KEY = 'c7baaf7a67df05efd96b1af36a69550a986a62f3b393e0ee72520c4e0ed82089';
const SHOPIFY_TOKEN = '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';
const SHOPIFY_STORE = 'sasto.in';

app.post('/webhook/orders_create', async (req, res) => {
  const order = req.body;

  const shipment = {
    order_id: order.id,
    name: order.shipping_address.name,
    address1: order.shipping_address.address1,
    city: order.shipping_address.city,
    pincode: order.shipping_address.zip,
    phone: order.shipping_address.phone,
    weight: 0.5,
    cod_amount: order.total_price,
  };

  const bsRes = await fetch('https://api.bigship.in/create-order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BIGSHIP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shipment),
  });

  const bsData = await bsRes.json();
  const trackingNumber = bsData.data?.awb_number;
  const trackingUrl = bsData.data?.tracking_url;

  await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-07/orders/${order.id}/fulfillments.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({
      fulfillment: {
        tracking_numbers: [trackingNumber],
        tracking_urls: [trackingUrl],
        notify_customer: true,
      },
    }),
  });

  res.status(200).send('Order synced to BigShip');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
