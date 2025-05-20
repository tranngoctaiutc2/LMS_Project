import Swal from "sweetalert2";

const createToast = () =>
  Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    customClass: {
      popup: "colored-toast",
    },
  });

const toastInstance = createToast();

const Toast = {
  success: (title = "Success") =>
    toastInstance.fire({ icon: "success", title }),

  error: (title = "Something went wrong") =>
    toastInstance.fire({ icon: "error", title }),

  warning: (title = "Warning") =>
    toastInstance.fire({ icon: "warning", title }),

  info: (title = "Info") =>
    toastInstance.fire({ icon: "info", title }),

  custom: (options = {}) =>
    toastInstance.fire({ icon: "info", title: "Message", ...options }),
};

export default Toast;
