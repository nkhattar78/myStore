import {parseCookies} from 'nookies'
import cookie from 'js-cookie';
import {useRouter} from 'next/router'
import Link from 'next/link'
import {useState} from 'react'
import StripeCheckout from 'react-stripe-checkout';
import baseUrl from '../helpers/baseUrl';
import timeoutFn from '../helpers/utils';
import Spinner from '../components/Spinner'

const Cart = ({error, products})=> {
    const router = useRouter();
    const {token} = parseCookies();
    const [cartProducts, setCartProducts] = useState(products)
    const [removeCartInProgress, setRemoveCartInProgress] = useState(false);
    const [checkoutInProgress, setCheckoutInProgress] = useState(false);
    const [isProductsCountZero, setIsProductsCountZero] = useState(products.length>0 ? false : true);


    let price = 0;
    if (!token) {
        return (
            <div className="center-align">
                <h3>Please login to view your cart</h3>
                <Link href = "/login"> 
                <a> <button className="btn waves-effect waves-light #2962ff blue accent-4" type="submit">Login
                   <i className="material-icons right">login</i>
               </button></a>
                </Link>
            </div>
        )
    }

    if (error) {
        M.toast({html:error, classes:"red"})
        cookie.remove("user");
        cookie.remove("token");
        router.push('/login');
    }

    const handleRemoveItemsFromCart= async (pid)=>{
        console.log('handled remove from cart.');
        setRemoveCartInProgress(true);
        const res = await fetch(`${baseUrl}/api/cart`, {
            method:"DELETE",
            headers:{
                "Content-Type":"application/json",
                "Authorization":token
            },
            body:JSON.stringify({
                productId:pid
            })
        });

        const res2 = await res.json();
        timeoutFn(2000);
        setRemoveCartInProgress(false);
        setCartProducts(res2);
        console.log('products count: ' + res2.length);
        console.log(res2);
        console.log(cartProducts);
        if (res2.length === 0) {
            console.log('setting isProductsCountZero flag as true')
            setIsProductsCountZero(true);
        }
    }

    const CartItems=() => {
        price = 0;
        return (
            <>
                {cartProducts.map(item=>{
                    price += item.quantity * item.product.price;
                    return(
                        <div style={{display:"flex", margin:"20px"}}>
                            <img src={item.product.mediaUrl} style={{width:"30%"}}/>
                            <div style={{marginLeft:"20px"}}>
                                <h6>{item.product.name}</h6>
                                <h6>{item.quantity} * {item.product.price}</h6>
                                <button className="btn red" onClick={()=>{handleRemoveItemsFromCart(item.product._id)}} disabled = {removeCartInProgress || checkoutInProgress}>
                                    {removeCartInProgress && <span>removing items from cart</span>}
                                    {!removeCartInProgress && <span>remove</span>}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </>
        )
    }

    const handleCheckout = async(paymentInfo) =>{
        console.log("handleCheckout");
        setCheckoutInProgress(true);
        console.log(paymentInfo);
        const res = await fetch(`${baseUrl}/api/payment`, {
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":token
            },
            body:JSON.stringify({paymentInfo})
        });

        const res2 = await res.json();
        setCheckoutInProgress(false);
        M.toast({html:res2.message, classes:"green"});
        router.push('/');
        
    }
    const Checkout = ()=>{
        return(
            <>
                <div className="center-align">
                    {checkoutInProgress && <Spinner/>}
                </div> 
                <div className = "container" style ={{display:'flex', justifyContent:"space-between"}}>
                    <h5>Total Rs. {price}</h5>
                    {products.length >0 && 
                    <StripeCheckout
                        name = "My Store"
                        amount = {price * 100}
                        image = {products.length>0?products[0].product.mediaUrl : ""}
                        currency = "INR"
                        shippingAddress = {true}
                        billingAddress = {true}
                        zipCode = {true}
                        stripeKey = "pk_test_51Ig8qySF1Tlbkvv1UjqWxG8J4lMfg30KH5y3vuv27M6MuI2hwBIiyUE7nF0IhXtBFIehEHkMEUNhWjpPuMPZnK7h00pSoiI8Gn"
                        token = {(paymentInfo) => {handleCheckout(paymentInfo)}}>
                            <button className = "btn blue" disabled={checkoutInProgress}>Checkout</button>
                    </StripeCheckout>}
                </div>
            </>
        )
    }

    const EmptyCart = () => {
            return (
                <div className="container" style={{alignItems:'center'}}>
                    <h5>Your cart is empty</h5>
                    <button className="btn green" onClick= {()=>{router.push("/")}}>Explore Products</button>
                </div>
            )
    }

    return(
        <div className="container">            
        {isProductsCountZero && <EmptyCart/>}
        {!isProductsCountZero &&
        <>
            <CartItems/>
            <Checkout/>
        </> 
        }
        </div>
    )
}

export async function getServerSideProps(context) {
    const {token} = parseCookies(context);
    if (!token) {
        return {
            props:{products:[]}
        }
    }
    const res = await fetch(`${baseUrl}/api/cart`, {
        headers:{
            "Authorization":token
        }
    });
    const products = await res.json();
    if (products.error) {
        return{
            props: {
                error: products.error
            }
        }
    }
    console.log("products", products);
    return { props: {products} } 
}export default Cart;
