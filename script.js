const { createApp, computed, ref, toRaw } = Vue

const app = createApp({
  setup() {
    const message = ref('Hello vue!')

    return { message }
  },
});

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

    function addToCart(product) {
      const index = cart.value.findIndex(el => el.id == product.id)
      const isExists = index !== -1;
      if (!isExists) {
        cart.value.push({ ...product, quantity: 1 })
      } else {
        cart.value[index].quantity += 1
      }

      const data = {
        currency: 'IDR',
        value: product.price,
        items: JSON.stringify([{
          quantity: 1,
          title: product.title,
          id: product.id,
          price: product.price,
        }]),
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
        title: el.title,
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
        gtag('event', 'view_cart', {
          currency,
          items: cart.value,
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
            ...data,
          })
        })
        .finally(() => {
          isCheckout.value = false;
        })
    }


    return { isCheckout, isShowCart, viewCart, city, products, total, cart, totalQty, checkout, addToCart, purchase }
  },
  template: `
  <div>
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
    <h2>Products</h2>
    <div style="display: flex; gap: 1rem">
      <div style="padding: 0.5rem;" v-for="product in products" :key="product.id">
        <p>{{product.title}}</p>
        <p>Rp. {{product.price}}</p>

        <button class="add-to-cart" @click="addToCart(product)">Add To Cart</button>
      </div>
    </div>


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
  `
})

app.mount('#app')
