const { createApp, computed, ref } = Vue

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

const ProductList = app.component('ProductList', {
  setup() {
    const products = ref([
      { id: 123, title: 'Product A', price: 400 },
      { id: 456, title: 'Product B', price: 200 }
    ])
    const cart = ref([])

    function addToCart(product) {
      const index = cart.value.findIndex(el => el.id == product.id)
      const isExists = index !== -1;
      if (!isExists) {
        cart.value.push({ ...product, qty: 1 })
      } else {
        cart.value[index].qty += 1
      }

      gtag('event', 'AddToCart', {
        'x-fb-event-id': makeid(),
        currency: 'IDR',
        value: product.price,
        qty: 1,
        user_data: {
          email_address: 'm.google@gmail.com'
        }
      })
    }

    const qty = computed(() => cart.value.reduce((acc, item) => acc + item.qty, 0))
    const total = computed(() => cart.value.reduce((acc, item) => acc + (item.qty * item.price), 0))

    function purchase() {
      gtag('event', 'PurchaseDL', {
        'x-fb-event-id': makeid(),
        currency: 'IDR',
        value: total.value,
        user_data: {
          email_address: 'm.google@gmail.com'
        }
      })
    }

    function dosomething() {
      gtag('event', 'Something', {
        'x-fb-event-id': makeid(),
        data: 'HEHE',
      })
    }

    return { products, total, dosomething, cart, qty, addToCart, purchase }
  },
  template: `
  <div>
    <p>Cart qty: ({{ qty }}), total: {{ total }} </p>
    <h2>Products</h2>
    <div style="display: flex; gap: 1rem">
      <div style="padding: 0.5rem;" v-for="product in products" :key="product.id">
        <p>{{product.title}}</p>
        <p>Rp. {{product.price}}</p>

        <button class="add-to-cart" @click="addToCart(product)">Add To Cart</button>
      </div>
    </div>

    <button class="TR-checkout">Checkout</button>
    <button class="TR-purchase">Purchase</button>
    <button class="TR-purchase-2">Purchase Fancy</button>
    <button @click="purchase()" class="TR-purchase-dl">Purchase Datalayer</button>
    <button @click="dosomething()">DO STH</button>
  </div>
  `
})

app.mount('#app')
