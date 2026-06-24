import { getConnection } from "@/lib/db"
import { getUserIdFromToken, normalizeAuthToken } from "@/lib/token-utils"

const PAYMENT_METHODS = new Set(["cod", "bank_transfer", "manual"])

export async function POST(req) {
  const token = normalizeAuthToken(req.headers.get("authorization"))
  const userId = getUserIdFromToken(token)

  if (!userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  const {
    items,
    shippingAddress,
    billingAddress,
    total,
    discountAmount,
    couponCode,
    paymentMethod = "cod",
  } = await req.json()

  if (!Array.isArray(items) || !items.length) {
    return Response.json({ message: "Cart is empty" }, { status: 400 })
  }

  if (!shippingAddress) {
    return Response.json({ message: "Shipping address is required" }, { status: 400 })
  }

  const orderTotal = Number(total)

  if (Number.isNaN(orderTotal) || orderTotal <= 0) {
    return Response.json({ message: "Invalid total amount" }, { status: 400 })
  }

  const normalizedPaymentMethod = PAYMENT_METHODS.has(paymentMethod) ? paymentMethod : "cod"
  const normalizedDiscountAmount = (discountAmount === undefined || discountAmount === null) ? 0 : discountAmount;
  const normalizedCouponCode = couponCode || null;
  const normalizedShippingAddress = shippingAddress ? JSON.stringify(shippingAddress) : null;
  const normalizedBillingAddress = billingAddress ? JSON.stringify(billingAddress) : normalizedShippingAddress;

  let connection
  try {
    connection = await getConnection()
    await connection.beginTransaction()

    const orderNumber = `ORD-${Date.now()}`

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, order_number, total_amount, discount_amount, coupon_code, shipping_address, billing_address, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        orderNumber,
        orderTotal,
        normalizedDiscountAmount,
        normalizedCouponCode,
        normalizedShippingAddress,
        normalizedBillingAddress,
        normalizedPaymentMethod,
        "pending",
      ],
    )

    const orderId = orderResult.insertId

    for (const item of items) {
      const quantity = Number(item.quantity) || 1
      if (quantity <= 0) {
        throw new Error("Invalid quantity detected")
      }

      const [productRows] = await connection.execute("SELECT id, price, stock, name FROM products WHERE id = ? FOR UPDATE", [
        item.id,
      ])

      if (!productRows.length) {
        throw new Error("One of the products could not be found")
      }

      const product = productRows[0]

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }

      await connection.execute("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [
        orderId,
        product.id,
        quantity,
        product.price,
      ])

      await connection.execute("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, product.id])
    }

    await connection.commit()

    return Response.json({
      message: "Order created successfully",
      order: {
        id: orderId,
        orderNumber,
        total: orderTotal,
        status: "pending",
        paymentMethod: normalizedPaymentMethod,
      },
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
    console.error("[v0] Error creating order:", error)
    return Response.json({ message: "Failed to create order" }, { status: 500 })
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
