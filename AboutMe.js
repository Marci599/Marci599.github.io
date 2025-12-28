function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

document.getElementById("age").innerHTML = getAge("2005/07/22");

var clicks = 0

document.getElementById("me").addEventListener("click", (event) => {
    clicks++;
    if(clicks == 5){
        window.alert("You will be redirected to my old site");
        window.open("old/index.html","_self");
    }
});

const dialog = document.querySelector("dialog");
const dialogCloseButton = document.getElementById("dialog-close-button");


document.getElementById("youtube-chip").addEventListener("click", (event) => {
    dialog.showModal();
});

dialogCloseButton.addEventListener("click", (event) => {
    dialog.close();
});

// Close the dialog when clicking the backdrop area (::backdrop)
dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
        dialog.close();
    }
});


 
