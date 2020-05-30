var csrfToken = document.querySelector('meta[name="_csrf"]').content;
var csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
XMLHttpRequest.prototype.origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function () {
    this.origOpen.apply(this, arguments);
    if (csrfHeader) {
        this.setRequestHeader(csrfHeader, csrfToken);
    }
    if (arguments[1].includes("socket/info")) {
        this.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }
};