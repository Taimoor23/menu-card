var tableNumber=null;
AFRAME.registerComponent("marker-handler",{
    init:async function(){
        this.el.addEventListener("markerFound",()=>{
            if(tableNumber!==null){
                var markerId=this.el.id
                this.handleMarkerFound()
            }
            console.log("marker is found")
        })
        this.el.addEventListener("markerLost",()=>{
            console.log("marker is lost")
            this.handleMarkerLost()
        })
    },
    handleMarkerFound:function(dishes,markerId){
        var todaysDate=new Date()
        var todaysDay=todaysDate.getDay()

        var days=[
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "firday",
            "saturday"
        ]
        var dish=dishes.filter(dish=>dish.id===markerId)[0]
        if(dish.unavailable_days.includes(days[todaysDay])){
            swal({
                icon:"warning",
                title:dish.dish_name.toUpperCase(),
                text:"Apologies, but the dish is unavailable today!",
                timer:2500,
                buttons:false
            })
        }
        else{
        var model=document.querySelector(`$#model-${dish.id}`)
        model.setAttribute("position",dish.model.geometry.position)
        model.setAttribute("rotation",dish.model.geometry.rotation)
        model.setAttribute("scale",dish.model.geometry.scale)

        model.setAttribute("visible",true)
        var ingredientsContainer=document.querySelector(`#main-plane-${dish.id}`)
        ingredientsContainer.setAttribute("visible",true)

        var pricePlane=document.querySelector(`#price-plane-${dish.id}`)
        pricePlane.setAttribute("visible",true)

        var buttonDiv=document.getElementById("button-div")
        buttonDiv.style.display="flex"
        var ratingButton=document.getElementById("rating-button")
        var orderButton=document.getElementById("order-button")
        var orderSummaryButton=document.getElementById("order-summary-button")

        var payButton=document.getElementById("pay-button")
        
        ratingButton.addEventListener("click",function(){
            swal({
                icon:"warning",
                title:"Rate this dish",
                text:"work in progress"
            })
        })
        orderButton.addEventListener("click",()=>{
            var tNumber
            tableNumber<9?(tNumber=`T0${tableNumber}`):`T${tableNumber}`
            this.handleOrder(tNumber,dish)
            swal({
                icon:"assets/thumbs-up-like-gesture-512.webp",
                title:"thanks for your order",
                text:"Your order is coming please wait!",
            })
        })
        orderSummaryButton.addEventListener("click",()=>{
            this.handleOrderSummary()
        })
        payButton.addEventListener("click",()=>{
            this.handlePayment()
        })
    }},
    handleOrderSummary:async function(){
        var tNumber;
        tableNumber<9?(tNumber=`T0${tableNumber}`):`T${tableNumber}`
        var orderSummary=await this.getOrderSummary(tNumber)
        var modelDiv=document.getElementById("modal-div")
        modelDiv.style.display="flex"
        var tableBodyTag=document.getElementById("bill-table-body")
        tableBodyTag.innerHTML=""

        //get the current order key
        var current_orders=Object.keys(orderSummary.current_orders)
        current_orders.map(i=>{
            var tr=document.createElement("tr")
            var item=document.createElement("td")
            var price=document.createElement("td")
            var quantity=document.createElement("td")
            var subtotal=document.createElement("td")

            item.innerHTML=orderSummary.current_orders[i].item
            price.innerHTML="$"+orderSummary.current_orders[i].price
            price.setAttribute("class","text-center")
            quantity.innerHTML=orderSummary.current_orders[i].quantity
            quantity.setAttribute("class","text-center")
            subtotal.innerHTML="$"+orderSummary.current_orders[i].subtotal
            subtotal.setAttribute("class","text-center")            
            tr.appendChild(item)
            tr.appendChild(price)            
            tr.appendChild(quantity)
            tr.appendChild(subtotal)

            tableBodyTag.appendChild(tr)

        })
        var totalTr=document.createElement()
        var td1=document.createElement("td")
        td1.setAttribute("class","no-line")

        var td2=document.createElement("td")
        td2.setAttribute("class","no-line")

        var td3=document.createElement("td")
        td3.setAttribute("class","no-line text-center")

        var strongTag=document.createElement("strong")
        strongTag.innerHTML="TOTAL:"
        td3.appendChild(strongTag)

        var td4=document.createElement("td")
        td4.setAttribute("class","no-line text-right")
        td4.innerHTML="$"+orderSummary.total_bill
        totalTr.appendChild(td1)
        totalTr.appendChild(td2)
        totalTr.appendChild(td3)
        totalTr.appendChild(td4)

        tableBodyTag.appendChild(totalTr)
        
    },
    handlePayment:function(){
        document.getElementById("modal-div").style.display="none"
        var tNumber
        tableNumber<=9?(tNumber=`T0${tableNumber}`):`t${tableNumber}`

        firebase
        .firestore()
        .collection("tables")
        .doc(tNumber)
        .update({
            current_orders:{},
            total_bill:0,
        })
        .then(()=>{
            swal({
                icon:"success",
                title:"Thanks for your payment",
                text:"we hope you enjoyed your food",
                timer:2500,
                buttons:false
            })
        })
    },
    handleOrder:function(tNumber,dish){
        firebase
        .firestore()
        .collection("tables")
        .docs(tNumber)
        .get()
        .then(doc=>{
            var details=doc.data()
            if (details["current_orders"][dish.id]){
                details["current_orders"][dish.id]["quantity"]+=1
                var current_quantity=["current_orders"][dish.id]["quantity"]
                details["current_orders"][dish.id]["subtotal"]=current_quantity*dish.price
            }
            else{
                details["current_orders"][dish.id]={
                    item:dish.dish_name,
                    price:dish.price,
                    quantity:1,
                    subtotal:dish.price*1
                }
            }
            details.total_bill+=dish.price
            firebase
            .firestore()
            .collection("tables")
            .doc(doc.id)
            .update(details)
        })
    },
    handleMarkerLost:function(){
        var buttonDiv=document.getElementById("button-div")
        buttonDiv.style.display="none"
    },
    askTableNum:function(){
        var iconUrl="https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png"
        swal({
            title:"welcome to hunger",
            icon:iconUrl,
            content:{
                element:"input",
                attributes:{
                    placeholder:"What's your table number?",
                    type:"number",
                    min:1
                }
            },
            closeOnClickOutside:false,
        }).then(inputValue=>{
            tableNumber=inputValue
        })

    }
})