(function () {
  emailjs.init("2G6uSYa1jQfvuzQHD");

  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "Отправка…";

    emailjs.sendForm(
      "service_gx7b7ej",
      "template_zjqno0l",
      form
    ).then(() => {
      status.style.color = "green";
      status.textContent = "Сообщение успешно отправлено.";
      form.reset();
    }).catch(() => {
      status.style.color = "red";
      status.textContent = "Ошибка отправки. Попробуйте позже.";
    });
  });
})();
