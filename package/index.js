// Handles all the things ajax cart related,
// based around the timber ajax cart, minus the jquery
import serialize from 'form-serialize'
import fetch from 'unfetch'
import yo from 'yo-yo'

const RicherAPI = {}

RicherAPI.onCartUpdate = (cart) => {
  console.log('items in the cart?', cart.item_count)
}

RicherAPI.addItemFromForm = (form, callback, errorCallback) => {
  form = serialize(form, {hash: true})
  fetch('/cart/add.js', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(form)
  })
    .then(r => {
      if ((typeof callback) === 'function') {
        callback(r.json())
      } else {
        RicherAPI.onCartUpdate(r.json())
      }
    })
}

RicherAPI.getCart = (callback) => {
  fetch('/cart.js', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(cart => {
      if ((typeof callback) === 'function') {
        callback(cart)
      } else {
        RicherAPI.onCartUpdate(cart)
      }
    })
}

RicherAPI.changeItem = (line, quantity, callback) => {
  console.log('fire a change item ajaaaaaxy baby')
}

const byId = (selector) => {
  return document.getElementById(selector)
}

const cleanProduct = (item, config) => {
  let img = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif'
  img = item.image ? item.image.replace(/(\.[^.]*)$/, '_small$1').replace('http:', '') : img

  // Define our cart object (easier to visualize)
  return {
    key: item.key,
    image: img,
    url: item.url,
    name: item.product_title,
    variation: item.variant_title,
    properties: item.properties,
    itemAdd: item.quantity + 1,
    itemMinus: item.quantity - 1,
    itemQty: item.quantity,
    price: slate.Currency.formatMoney(item.price), // eslint-disable-line
    vendor: item.vendor,
    linePrice: slate.Currency.formatMoney(item.line_price), // eslint-disable-line
    originalLinePrice: slate.Currency.formatMoney(item.original_line_price), // eslint-disable-line
    discounts: item.discounts,
    discountsApplied: item.line_price === item.original_line_price ? false : true // eslint-disable-line
  }
}

const Richer = (options = {}) => {
  const defaults = {
    addToCart: '.js-add-to-cart', // classname
    addToCartForm: 'AddToCartForm', // id
    cartContainer: 'CartContainer', // id
    cartCounter: 'CartCounter', // id
    items: []
  }

  const config = Object.assign({}, defaults, options)

  const dom = {
    addToCartForm: byId(config.addToCartForm),
    cartContainer: byId(config.cartContainer),
    cartCounter: byId(config.cartCounter)
  }

  const init = (options) => {
    if (dom.addToCartForm) {
      AddToCart()
    }
    RicherAPI.getCart(cartUpdateCallback)
  }

  const AddToCart = () => {
    const form = dom.addToCartForm

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      form.classList.remove('is-added')
      form.classList.add('is-adding')

      RicherAPI.addItemFromForm(e.target, itemAddedCallback, itemErrorCallback)
    })

    const itemAddedCallback = () => {
      RicherAPI.getCart(cartUpdateCallback)
    }

    const itemErrorCallback = (XMLHttpRequest, textStatus) => {
      console.log('error family')
    }
  }

  const cartUpdateCallback = (cart) => {
    updateCount(cart)
    buildCart(cart)
    RicherAPI.onCartUpdate(cart)
  }

  const updateCount = (cart) => {
    const counter = dom.cartCounter
    counter.innerHTML = cart.item_count
  }

  const buildCart = (cart) => {
    const cartContainer = dom.cartContainer
    cartContainer.innerHTML = null

    if (cart.item_count === 0) {
      cartContainer.innerHTML = `<p>We're sorry your cart is empty</p>`
      return
    }

    var el = cartBlock(cart.items, cart, update)

    function cartBlock (items, cart, qtyControl) {
      console.log(cart)
      return yo`
        <div>
          ${items.map((item) => {
            const product = cleanProduct(item, config)
            return yo`
              <div>
                <div class='f jcb'>
                  <div>
                    <img src='${product.image}' alt='${product.name}' />
                  </div>
                  <div>
                    <h5><a href='${product.url}'>${product.name}</a></h5>
                    ${product.variation ? yo`<span>${product.variation}</span>` : null}
                    ${realPrice(product.discountsApplied, product.originalLinePrice, product.linePrice)}
                  </div>
                  <div>
                    <div onclick=${() => qtyControl(item, product.itemQty, 'decrease')}>Decrease</div>
                    <div>Qty: ${product.itemQty}<div>
                  </div>
                </div>
                ${subTotal(cart.total_price, cart.total_cart_discount)}
              </div>
            `
          })}
        </div>
      `
    }

    function subTotal (total, discount) {
      console.log('sup')
      const totalPrice = slate.Currency.formatMoney(total)  // eslint-disable-line
      return yo`
        <div>
          <h5>Subtotal: ${totalPrice}</h5>
        </div>
      `
    }

    function realPrice (discountsApplied, originalLinePrice, linePrice) {
      if (discountsApplied) {
        return yo`
          <div>
            <small className='strike'>${originalLinePrice}</small>
            <br /><span>${linePrice}</span>
          </div>
        `
      } else {
        return yo`
          <span>${linePrice}</span>
        `
      }
    }

    function update (item, quantity, direction) {
      console.log(item, quantity, direction)

      let newCart = cartBlock(cart.items, cart, update)
      yo.update(el, newCart)
    }

    cartContainer.appendChild(el)
  }

  return {
    init
  }
}

module.exports = Richer
