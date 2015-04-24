var item_count = 0;
var login_page;
var app_page;

function init() {
    login_page = document.getElementById("login");
    app_page = document.getElementById("todoapp");
    reg_page = document.getElementById("registration");
    clearBody();
    getListBE();
}

function showLoginPage() {
    clearBody();
    document.body.appendChild(login_page);
}

function showAppPage() {
    clearBody();
    document.body.appendChild(app_page);
}

function showRegPage() {
    clearBody();
    document.body.appendChild(reg_page);
}

function clearBody() {
    var body_children = document.body.children;
    for (var i = body_children.length - 1; i >= 0; i--) {
        document.body.removeChild(body_children[i]);
    }
}

function addElementToListFromForm(e) {
    if(e.keyCode === 13){
        var new_record_textbox = document.getElementById("new-todo");
        if (new_record_textbox.value === "") return;
        addNewItemToListBE(new_record_textbox.value, getNewItemId());
        new_record_textbox.value = "";
    }
}

function getNewItemId () {
    var list = document.getElementById("todo-list").children;
    var max_id = 0;
    for (var i = list.length - 1; i >= 0; i--) {
        var cur_id = parseInt(list[i].getAttribute("data-id"));
        if (cur_id > max_id) {
            max_id = cur_id;
        }
    }
    return max_id + 1;
}

function addElementToListFE(text, data_id, status) {
    createNewTableRow(text, data_id, status);
    if (!status) incrementElementCounter();
    if (item_count === 1) showMainAndFooter();
    changeCounterLabel();
}

function loadListFromServer(list) {
    var completed_counter = 0;
    for(var elem in list) {
        if (list.hasOwnProperty(elem))
            if (list[elem].completed) completed_counter++;
            addElementToListFE(list[elem].value, elem, list[elem].completed);
    }
    if (item_count === 0 && Object.keys(list).length > 0) showMainAndFooter();
    if (completed_counter === Object.keys(list).length && Object.keys(list).length > 0)
        document.getElementById("toggle-all").checked = true;
}

function createNewTableRow(task, data_id, status) {
    var elem = document.getElementById("todo-list");
    var newelem = document.createElement("li");
    newelem.className = "";
    if (status) newelem.className = "completed";
    var attr = document.createAttribute("data-id");
    attr.value = data_id;
    newelem.setAttributeNode(attr);
    elem.appendChild(newelem);
    var newelem2 = document.createElement("div");
    newelem2.className = "view";
    newelem.appendChild(newelem2);
    newelem2.innerHTML = '<input class="toggle" type="checkbox" onclick="handleCompletedTask(this)">';
    newelem2.innerHTML += '<label>' + task + '</label>';
    newelem2.innerHTML += '<button class="destroy" onclick="deleteElementFromList(this)"></button>';
    if (status) newelem2.childNodes[0].checked = true;
}

function showMainAndFooter() {
    document.getElementById("main").removeAttribute("style");
    document.getElementById("footer").removeAttribute("style");
}

function hideMainAndFooter() {
    document.getElementById("main").setAttribute("style","display: none;");
    document.getElementById("footer").setAttribute("style","display: none;");
}

function incrementElementCounter() {
    item_count++;
}

function decrementElementCounter() {
    item_count--;
}

function changeCounterLabel() {
    var elem = document.getElementById("todo-count");
    var list_elem = document.getElementById("todo-list");
    elem.innerHTML = "<strong>" + item_count + "</strong> items left";
}

function deleteElementFromList(elem) {
    deleteElemInListBE(elem.parentNode.parentNode.getAttribute("data-id"));
    var li_node = elem.parentNode.parentNode;
    //decrement only if task isn't completed
    if (li_node.attributes[0].value === "") decrementElementCounter();
    changeCounterLabel();
    var list_elem = document.getElementById("todo-list");
    if (item_count === 0 && list_elem.childNodes.length - 1 === 0) {
        var counter_elem = document.getElementById("todo-count");
        counter_elem.innerHTML = "";
        hideMainAndFooter();
        var select_all_elem = document.getElementById("toggle-all");
        select_all_elem.checked = false;
    }
    li_node.parentNode.removeChild(li_node);
}

function handleCompletedTask(elem) {
    var isChecked = elem.checked;
    var select_all_elem = document.getElementById("toggle-all");
    var list = document.getElementById("todo-list").children;
    if (isChecked) {
        updateExistingElemInListBE(elem.parentNode.childNodes[1].innerHTML,
            elem.parentNode.parentNode.getAttribute("data-id"), 1);
        elem.parentNode.parentNode.className = "completed";
        decrementElementCounter();
        changeCounterLabel();
        if(item_count === 0 && list.length > 0 && select_all_elem.checked === false) select_all_elem.checked = true;
    } else {
        updateExistingElemInListBE(elem.parentNode.childNodes[1].innerHTML,
            elem.parentNode.parentNode.getAttribute("data-id"), 0);
        elem.parentNode.parentNode.className = "";
        incrementElementCounter();
        changeCounterLabel();
        if(item_count !== 0 && list.length > 0 && select_all_elem.checked === true) select_all_elem.checked = false;
    }
}

function checkAllHandler(elem) {
    var i;
    var isChecked = elem.checked;
    var list = document.getElementById("todo-list").children;
    if (isChecked) {
        for (i = 0; i < list.length; i++) {
            if (list[i].firstChild.firstChild.checked === false) {
                list[i].firstChild.firstChild.checked = true;
                handleCompletedTask(list[i].firstChild.firstChild);
            }
        }
    } else {
        for (i = 0; i < list.length; i++) {
            if (list[i].firstChild.firstChild.checked === true) {
                list[i].firstChild.firstChild.checked = false;
                handleCompletedTask(list[i].firstChild.firstChild);
            }
        }
    }
}

function clearCompleted() {
    var list = document.getElementById("todo-list").children;
    for (var i = list.length - 1; i >= 0; i--) {
        if (list[i].className === "completed") {
            deleteElementFromList(list[i].firstChild.lastChild);
        }
    }
}

function registerButton() {
    var fullname = document.getElementById("regfullname").value;
    var username = document.getElementById("regusername").value;
    var password = document.getElementById("regpassword").value;
    var password2 = document.getElementById("regpassword2").value;
    if (fullname === "" || username === "" || password === "" || password2 === "") {
        alert("Error: one of the fields or more is empty!");
        return;
    }
    if (password !== password2) {
        alert("Error: passwords aren't equal!");
        return;
    }
    var reqObj = {username: username, fullname: fullname, password: password};
    $.ajax({
        url:'/register',
        type: 'POST',
        data: JSON.stringify(reqObj),

        success: function(result,status,xhr) {
            alert(xhr.responseText);
            showLoginPage();
        },
        error: function(xhr,status,error) {
            alert(xhr.responseText);
        }
    });
}

function loginButton() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    if (username === "" || password === "") {
        alert("Error: username or password are empty");
        return;
    }
    $.ajax({
        url:'/login?username='+username+'&password='+password,
        type: 'GET',

        success: function(result,status,xhr) {
            getListBE();
        },
        error: function(xhr,status,error) {
            alert(xhr.responseText);
        }
    });
}

function getListBE() {
    $.ajax({
        url:'/item',
        type: 'GET',

        success: function(result,status,xhr) {
            if(xhr.responseText === "{}") showLoginPage();
            else {
                showAppPage();
                var obj = JSON.parse(xhr.responseText);
                loadListFromServer(obj["todoList"]);
            }
        }
    });
}

function addNewItemToListBE(text, data_id) {
    var reqObj = {id: data_id, value: text};
    $.ajax({
        url:'/item',
        type: 'POST',
        data: JSON.stringify(reqObj),

        success: function(result,status,xhr) {
            addElementToListFE(text, data_id, false);
        },
        error: function(xhr,status,error) {
            var resObj = JSON.parse(xhr.responseText);
            alert(resObj.msg);
            clearBody();
            getListBE();
        }
    });
}

function updateExistingElemInListBE(text, data_id, status) {
    var reqObj = {id: data_id, value: text, status: status};
    $.ajax({
        url:'/item',
        type: 'PUT',
        data: JSON.stringify(reqObj),

        error: function(xhr,status,error) {
            var resObj = JSON.parse(xhr.responseText);
            alert(resObj.msg);
            clearBody();
            getListBE();
        }
    });
}

function deleteElemInListBE(data_id) {
    var reqObj = {id: data_id};
    $.ajax({
        url:'/item',
        type: 'DELETE',
        data: JSON.stringify(reqObj),

        success: function(result,status,xhr) {
            if (data_id.toString() === "-1") getListBE();
        },
        error: function(xhr,status,error) {
            var resObj = JSON.parse(xhr.responseText);
            alert(resObj.msg);
            clearBody();
            getListBE();
        }
    });
}