/**
 * Add
 */
function addToDo() {
  // 입력 필드와 목록 요소를 가져옵니다.
  const toDoInput = document.getElementById("toDoInput");
  const toDoList = document.getElementById("toDoList");

  // 입력 필드가 비어있으면 사용자에게 메시지를 표시하고 함수를 종료합니다.
  if (toDoInput.value === "") {
    alert("할 일을 입력하세요!");
    return;
  }

  // 새로운 항목을 생성하고 목록에 추가합니다.
  const listItem = document.createElement("li");
  listItem.innerHTML = `
        <input type="checkbox" onchange="checkTodo(this)">
        ${toDoInput.value}
        <button onclick="removeToDo(this)">삭제</button>
    `;
  toDoList.appendChild(listItem);
  toDoInput.value = ""; // 입력 필드를 초기화 합니다.
}

/**
 * Check
 */
function checkTodo(checkbox) {
  // 체크박스의 부모 요소인 리스트 항목을 가져옵니다.
  const listItem = checkbox.parentNode;

  // 체크박스가 선택되었을 때, "checked" 클래스를 추가하여 스타일을 변경합니다.
  // 선택 해제되면 "checked" 클래스를 제거합니다.
  if (checkbox.checked) {
    listItem.classList.add("checked");
  } else {
    listItem.classList.remove("checked");
  }
}

/**
 * Remove
 */
function removeToDo(button) {
  // 사용자에게 삭제 여부를 물어보고 true 또는 false를 반환합니다.
  const removeYn = confirm("삭제하시겠습니까?");

  if (removeYn) {
    // 삭제 버튼의 부모 요소인 리스트 항목을 가져와서 목록에서 제거합니다.
    const listItem = button.parentNode;
    const toDoList = listItem.parentNode;
    toDoList.removeChild(listItem);
  }
}
