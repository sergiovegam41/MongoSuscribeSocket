let tokenToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiODUzYWVhYzNmY2RhYjM3M2Q1NDYwYzg4MTFlYmMxZmMyYjRhZDM4NWI5YTAzOWQ1ZjhjNzZhYzgzYzA5NTcxNzI4Yzc5MDQwODA3MzU3YTUiLCJpYXQiOjE3MDEwMzEyMDAuMDkxNjQ4LCJuYmYiOjE3MDEwMzEyMDAuMDkxNjUyLCJleHAiOjE3MDExMTc2MDAuMDgwMDA2LCJzdWIiOiIxOSIsInNjb3BlcyI6W119.G6MKI4QLoLh-cJjy3DqK8NpLnHDPv4nt4vpyMEhWfmGQXFzTX6vo_CzeaInrk-p_XiKGPOv8Aw9iSEwSnc-ZM6HXkVnWK5FcaOI1xBHtyg1hWNlP6oAQfBktb0WdzrE9Y9N6DJKcTRYR81arlS-wSGS_VV-qBLhJwrFp-qy2Tn4pkg02wVubK414_JYDCva6FraYswH7QRj8VW4O9ilost4Us-caYQ7uwCsnFBKHPhuuNDuM-ukC_ZuhA_Of0HoH-_cljMDsn71ihxJyyHIHJfwVWaE5PBf7pZmYNDs2wKMVwSuQ6Z72-VSa9dR0GuKR1oTPyJexRyFMnZl0WJjp_UclmEsl-SAxnGwX5Lq8XAfzkdkfoQgjuWc7hmmY0jX_KADSV9w9dj0dikRpfWbOAk_xIhDhuTi8YCLmyqMTI6SVeoBe8LCZ_p2UcrLYRYRkpN104M6QcaKHxFBhPE3_K-C9BPA89lSMafwH-jnTdT-6UmEr2RXkA_aFe5e6q-Dx78x9TxK9xsHin4j0pvRqstVkKOKKY6e1EGdwKdV0hZ9BGdapvEYpmThW5yswXArkXydCI1vv-GGxMwBiA6ndxNtQSf5TIvMReQBm-TVEhyLep88fDRtwtuGlsxrab8Vh5CZeSfOyOtN7eeXr8jSdd--vcMiZzJToSy9-t08pHyU";

const socket = io()

socket.emit("cliente:tryAutch",{
    token: tokenToken,
    accion: "clienteServices"
})


socket.on('server:init',(dataG)=>{
    
    if(!dataG.success){
        alert(dataG.msj)
    }
    



    // Lista de frutas
    var frutas = dataG.initData.data;

    // Obtener el elemento select
    var select = document.getElementById("frutas");

    // Agregar opciones al select utilizando un ciclo for
    for (var i = 0; i < frutas.length; i++) {
        var option = document.createElement("option");
        option.text = frutas[i].login + " " + frutas[i].servidor;
        option.value = frutas[i].login;
        select.add(option);
    }

    select.addEventListener("change", function() {
        var seleccion = select.value;
        console.log("Seleccionaste: " + seleccion);
        socket.emit("client:analize:change_account",{ login: seleccion})

    });


})

// 