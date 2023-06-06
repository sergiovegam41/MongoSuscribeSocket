const socket = io()

socket.on('server:refresh',(data)=>{
    console.log(data)
    console.log("refresh")
    render(data)
   
})

socket.on('server:init',(data)=>{
    console.log(data)
    console.log("init data")

    render(data)
})

function render(data){

    document.getElementById('body').innerHTML = ''

    data.forEach(element => {
        document.getElementById('body').innerHTML += "</br></br>---</br>"
        document.getElementById('body').innerHTML += element._id+"</br>"
        document.getElementById('body').innerHTML += "Tecnico: "+element.technical_id+"</br>"
        document.getElementById('body').innerHTML += "Cliente: "+element.user_id+"</br>"
        document.getElementById('body').innerHTML += "Amount: "+element.amount+"</br>"
        document.getElementById('body').innerHTML += element.createdAt+"</br>"
        document.getElementById('body').innerHTML += element.updatedAt+"</br></br>---</br>"
    });
   
}