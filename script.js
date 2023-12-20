const { createApp, computed, ref, toRaw } = Vue

const app = createApp({
  setup() {
    const message = ref('Hello vue!')

    return { message }
  },
});

function createTrxID() {
  return `trx_${makeid(10)}`
}

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const api = {
  finalizeCheckout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    })
  }
}

app.component('Product', {
  props: ['product'],
  setup(props) {
    const isShowDetail = ref(false);

    function toggleShowDetail() {
      isShowDetail.value = !isShowDetail.value

      if (isShowDetail.value) {
        console.log('hei')
        const items = [
          {
            id: props.product.id,
            item_id: props.product.id,
            item_name: props.product.title,
            quantity: 1
          }
        ]
        gtag('event', 'ViewItemDL', {
          currency: 'IDR',
          value: props.product.price,
          items,
          contents: JSON.stringify(items),
        })
      }
    }

    return { isShowDetail, toggleShowDetail }
  },
  template: `
  <div style="padding: 0.5rem; width: 180px">
    <p>Title: {{product.title}}</p>
    <p>Rp. {{product.price}}</p>
    <button @click="toggleShowDetail">View</button>
    <div v-show="isShowDetail">
      <hr />
      <p>Lorem ipsum sit amet</p>
      <button @click="$emit('add-to-cart')">Add To Cart</button>
    </div>
  </div>
  `
})

const ProductList = app.component('ProductList', {
  setup() {
    const isCheckout = ref(false);
    const city = ref('');
    const isShowCart = ref(false);
    const products = ref([
      { id: 123, title: 'Product A', price: 400 },
      { id: 456, title: 'Product B', price: 200 },
      { id: 789, title: 'Product C', price: 320 }
    ])
    const cart = ref([])

    function handleTest() {
      gtag('event', 'view_item', {
        currency: 'IDR',
        items: JSON.stringify([
          { item_id: 123, item_name: 'Awesome', quantity: 1, price: 90000 }
        ]),
        value: 90000,
      })
    }

    function addToCart(product) {
      const index = cart.value.findIndex(el => el.id == product.id)
      const isExists = index !== -1;
      if (!isExists) {
        cart.value.push({ ...product, quantity: 1 })
      } else {
        cart.value[index].quantity += 1
      }

      const items = [{
        id: product.id,
        item_id: product.id,
        item_name: product.title,
        price: product.price,
        quantity: 1,
      }]
      const data = {
        currency: 'IDR',
        value: product.price,
        items,
        contents: JSON.stringify(items),
        user_data: {
          email_address: 'm.google@gmail.com',
          address: { city: city.value }
        }
      }
      const eventId = makeid()
      gtag('event', 'AddToCartDL', {
        'x-fb-event-id': eventId,
        ...data,
      })
    }

    const email = 'foobar@gmail.com';
    const currency = 'IDR';
    const totalQty = computed(() => cart.value.reduce((acc, item) => acc + item.quantity, 0))
    const total = computed(() => cart.value.reduce((acc, item) => acc + (item.quantity * item.price), 0))

    // FB events: AddToCart, InitiateCheckout, Purchase
    // Data layout events: AddToCartDL, InitiateCheckoutDL, PurchaseDL

    const checkoutMeta = computed(() => {
      const items = cart.value.map(el => ({
        id: el.id,
        item_id: el.id,
        item_name: el.title,
        price: el.price,
        quantity: el.quantity,
      }));
      return {
        currency,
        value: total.value,
        items,
        contents: JSON.stringify(items),
        user_data: {
          email_address: email,
          address: { city: city.value },
        }
      }
    })

    function checkout() {
      if (!total.value) return;

      isCheckout.value = true;
      const data = toRaw(checkoutMeta.value)
      const eventId = makeid();
      gtag('event', 'InitiateCheckoutDL', {
        'x-fb-event-id': eventId,
        ...data,
      })
    }

    function viewCart() {
      isShowCart.value = !isShowCart.value

      if (isShowCart.value) {
        const items = cart.value.map(el => ({
          item_id: el.id,
          item_name: el.title,
          price: el.price,
          quantity: el.quantity,
        }))
        gtag('event', 'ViewCartDL', {
          currency,
          contents: JSON.stringify(items),
          value: total.value,
        })
      }
    }

    function purchase() {
      api.finalizeCheckout()
        .then(() => {
          const data = toRaw(checkoutMeta.value)
          gtag('event', 'PurchaseDL', {
            'x-fb-event-id': makeid(),
            transaction_id: createTrxID(10),
            ...data,
          })
        })
        .finally(() => {
          isCheckout.value = false;
        })
    }


    return { isCheckout, isShowCart, handleTest, viewCart, city, products, total, cart, totalQty, checkout, addToCart, purchase }
  },
  template: `
  <div>
    <h2>Admin</h2>
    <admin-app />
    <hr />


    <h2>Your Cart</h2>
    <p>Total: {{ total }} </p>

    <button @click="viewCart">View Cart</button>

    <table v-show="isShowCart">
      <thead>
        <tr>
          <td>ID</td>
          <td>Title</td>
          <td>Qty</td>
          <td>Price</td>
          <td>Total</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in cart" :key="product.id">
          <td>{{ product.id }}</td>
          <td>{{ product.title }}</td>
          <td>{{ product.quantity }}</td>
          <td>{{ product.price }}</td>
          <td>{{ product.price * product.quantity }}</td>
        </tr>
      </tbody>
    </table>

    <hr />

    <div class="main" style="display: flex">
      <div class="left" style="flex-basis: 500px">
        <button @click="handleTest">Test</button>
        <h2>Products</h2>
        <div style="display: flex; gap: 1rem">
          <product v-for="product in products" :product="product" :key="product.id" @add-to-cart="addToCart(product)" />
        </div>
      </div>

      <div class="right">
        <button @click="checkout()">Checkout</button>

        <template v-if="isCheckout">
        <form @submit.prevent="purchase()">
          <div>
            <label>Address</label>
            <textarea v-model="city" />
          </div>
          <button type="submit" class="TR-purchase-dl">Purchase</button>
        </form>
        </template>
      </div>
    </div>
  </div>
  `
})

const AdminApp = app.component('AdminApp', {
  setup() {
    const orderID = ref('');
    const userID = ref('usr_' + makeid(10));


    function createOrder() {
      orderID.value = 'ord_' + makeid(10);

      gtag('event', 'OrderCreated', {
        order_id: orderID.value,
        user_id: userID.value,
      })
    }

    function confirmPayment() {
      if (!orderID.value) return
      gtag('event', 'PaymentConfirmed', {
        order_id: orderID.value,
        user_id: userID.value,
      })
    }

    function markServiceDone() {
      if (!orderID.value) return
      gtag('event', 'ServiceDone', {
        order_id: orderID.value,
        user_id: userID.value,
      })
      orderID.value = ''
    }

    return { userID, orderID, createOrder, confirmPayment, markServiceDone }
  },
  template: `<div>
    <p>user id: {{ userID }}</p>
    <p>order id: {{ orderID }}</p>

    <button @click="createOrder()">Create Order</button>
    <button @click="confirmPayment()">Confirm Payment</button>
    <button @click="markServiceDone()">Mark Service Done</button>
  </div>`
})

app.mount('#app')
