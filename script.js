const { createApp, ref } = Vue

const app = createApp({
  setup() {
    const message = ref('Hello vue!')

    return { message }
  },
});

const ProductList = app.component('ProductList', {
  setup() {
    const products = ref([
      { id: 123, title: 'Product A', price: 8000 },
      { id: 456, title: 'Product B', price: 200 }
    ])
    const cart = ref([])

    function addToCart(product) {
      cart.value.push(product)
    }

    return { products, cart, addToCart }
  },
  template: `
  <div>
    <p>Cart ({{ cart.length }})</p>
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
  </div>
  `
})

app.mount('#app')
