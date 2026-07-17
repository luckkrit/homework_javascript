const products = {
    // add: function (f) {
    //     console.log(f)
    //     return false
    // },
    list: function () {
        console.log("list")
    },
    create: function () {
        console.log("create")
        let form = `
        <form class='border flex' onsubmit='return add(this)'>
        <input class='border' name='name' />
        <button>ok</button>
        </form>`
        console.log(document.getElementById('content'))
        document.getElementById('content').innerHTML = form;
        window.add = function () {
            console.log('add')
            return false;
        }
    }
}
function changeMode(mode) {
    products[mode]();
}