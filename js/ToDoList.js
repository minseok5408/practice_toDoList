/** add */
function addToDo() {
    const toDoInput = document.getElementById("toDoInput");
    const toDoList = document.getElementById("toDoList");

    if (toDoInput.value === "") {
        alert("할 일을 입력하세요!");
        return;
    }

    const listItem = document.createElement("li");
    listItem.innerHTML =
        `
    <input type="checkbox" onchange="checkTodo(this)">
    ${toDoInput.value}
    <button onclick="removeToDo(this)">삭제</button>
  `;
    toDoList.appendChild(listItem);
    toDoInput.value = "";
}

/** check */
function checkTodo(checkbox) {
    const listItem = checkbox.parentNode;
    if (checkbox.checked) {
        listItem.classList.add("checked");
    } else {
        listItem.classList.remove("checked");
    }
}

/** remove */
function removeToDo(button) {
    const listItem = button.parentNode;
    const toDoList = listItem.parentNode;
    toDoList.removeChild(listItem);
}