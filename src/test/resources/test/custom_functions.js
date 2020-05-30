/** MOUSE COORDINATES INSIDE ELEMENTS **/
function getRelativeCoordinates(event, element) {
    const position = {
        x: event.pageX,
        y: event.pageY
    };

    const offset = {
        left: element.offsetLeft,
        top: element.offsetTop
    };

    let reference = element.offsetParent;

    while (!isUndef(reference)) {
        offset.left += reference.offsetLeft;
        offset.top += reference.offsetTop;
        reference = reference.offsetParent;
    }

    return {
        x: position.x - offset.left,
        y: position.y - offset.top,
    };
}


/** MODALS **/
function openModal(modalId) {
    document.getElementById(modalId).classList.add("is-active");
}

function openModalByElement(element) {
    element.classList.add("is-active");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("is-transparent");
    setTimeout(function () {
        document.getElementById(modalId).classList.remove("is-transparent")
        document.getElementById(modalId).classList.remove("is-active")
    }, 250);
}

function closeModalByElement(element) {
    element.classList.add("is-transparent");
    setTimeout(function () {
        element.classList.remove("is-transparent")
        element.classList.remove("is-active")
    }, 250);
}

/** TOASTS (USE BULMA-TOAST AND ANIMATION.CSS) **/
function viewToast(text, type, duration, fontSizeClass) {
    var cssType = type ? type : 'is-info';
    var toastDuration = duration ? duration : 3000;

    var toastText = "<div>";
    if (type == "is-success") {
        toastText += "<i class=\"fas fa-check fa-2x\"></i>";
    } else {
        toastText += "<i class=\"fas fa-exclamation-triangle fa-2x\"></i>";
    }
    if (fontSizeClass) {
        toastText += "<span class=\"" + fontSizeClass + "\" style='margin-left: 5px;'>" + text + "</span></div>";
    } else {
        toastText += "<span class=\"is-size-4\" style='margin-left: 5px;'>" + text + "</span></div>";
    }

    bulmaToast.toast({
        message: toastText,
        type: cssType,
        position: 'top-center',
        duration: toastDuration,
        pauseOnHover: true,
        animate: {in: 'fadeIn', out: 'fadeOut'}
    });
}

/** SCROLL FUNCTION **/
function scrollToWrapper(x, y) {
    window.scrollTo({
        left: x,
        top: y,
        behavior: 'smooth'
    });
}

/** GET POSITION (RELATIVE TO VIEWPORT) OF AN HTML ELMENT GIVEN THE QUERY **/
function getHtmlPosition(queryStringSelector) {
    var element = document.querySelector(queryStringSelector);
    var pos = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    };

    if (element) {
        pos.top = element.getBoundingClientRect().top;
        pos.left = element.getBoundingClientRect().left;
        pos.bottom = element.getBoundingClientRect().bottom;
        pos.right = element.getBoundingClientRect().right;
    }

    return pos;
}

/** GET QUERY PARAMETER BY NAME */
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/** GET QUERY PARAMETERS FROM CURRENT WINDOW LOCATION HASH (#/namepage?param1=1&param2=2...) **/
function getQueryParameters() {
    var params = {};
    var currentHash = window.location.hash;
    var paramString = currentHash.substring(currentHash.indexOf('?') + 1);
    var vars = paramString.split('&');

    vars.forEach(function (param, index) {
        var pair = param.split('=');

        var name = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);

        params[name] = value;
    });

    return params;
}

function sendErrorToBackend(stacktrace) {
    var url = errorHandlingUrl + "?browser=" + getBrowser();
    $.ajax({
        type: 'POST',
        url: url,
        data: stacktrace,
        contentType: 'text/plain',
        success: function (msg) {

        }
    });
}

function getBrowser() {
    var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return M.join(' ');
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function formatTwoDigits(number) {
    return (number > 9) ? number : ("0" + number);
}

function formatTagValue(inputNumber) {
    if (inputNumber !== null) {
        var decimalDigits = 3;
        if (Math.abs(inputNumber) >= 1000) {
            decimalDigits = 0;
        } else if (Math.abs(inputNumber) < 1000 && Math.abs(inputNumber) >= 100) {
            decimalDigits = 1;
        } else if (Math.abs(inputNumber) < 100 && Math.abs(inputNumber) >= 10) {
            decimalDigits = 2;
        } else if (Math.abs(inputNumber) < 10 && Math.abs(inputNumber) >= 1) {
            decimalDigits = 3;
        } else if (Math.abs(inputNumber) < 1) {
            decimalDigits = 4;
        }

        var output = inputNumber.toFixed(decimalDigits);
        return output;
    } else {
        return null;
    }
}

var getColorForPercentage = function (value) {
    var hue = ((1 - value) * 190).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
}

function copyShareLink(event) {
    var text = event.parentElement.getElementsByClassName("linkSpan")[0].innerHTML;
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    bulmaToast.toast({
        message: "<span class=\"icon\"><i class=\"fas fa-check\"></i></span> " + linkCopiedText,
        position: 'top-center',
        duration: 3000,
        type: "is-success",
        animate: {in: 'fadeIn', out: 'fadeOut'}
    });
}

function getUrlQueryParams() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getTextColorBasedOnBackground(backgroundColor) {

    var textColor;

    if (backgroundColor == null || backgroundColor == "") {
        textColor = "#000000";
    } else {
        var bigint = parseInt(backgroundColor.replace('#', '').substring(0, 6), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        textColor = (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? "#000000" : "#ffffff";
    }

    return textColor;
}

function clone(object) {
    return JSON.parse(JSON.stringify(object));
}

function openWindowWithHtml(html) {
    let win = window.open();
    win.document.write(html)
}

function uniqueArray(array, property) {
    var flags = {};
    var newArray = array.filter(function (entry) {
        if (flags[entry[property]]) {
            return false;
        }
        flags[entry[property]] = true;
        return true;
    });
    return newArray;
}

function uniquePrimitiveArray(array) {
    let unique = array.filter(function (x, i, a) {
        return a.indexOf(x) == i;
    });
    return unique;
}

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

function isUndef(v) {
    return v === undefined || v === null
}

function isEmptyOrNullObject(obj) {
    return isUndef(obj) || isEmptyObject(obj)
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    return JSON.stringify(a) == JSON.stringify(b);
}

function objectEqual(a, b) {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) {
        return false;
    }
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return re.test(String(email).toLowerCase());
}

function removeParentheses(value) {
    return value.indexOf("(") != -1 ? value.substring(0, value.indexOf("(")) : value
}

function switchParentheses(value) {
    let output = value;
    let part1 = "";
    let part2 = "";
    const indexOpen = value.indexOf("(");
    const indexClose = value.indexOf(")");

    if (indexOpen >= 0 && indexClose >= 0) {
        part1 = output.substring(indexOpen + 1, indexClose).trim();
        part2 = " (" + output.substring(0, indexOpen - 1).trim() + ")";
        output = part1 + part2
    }
    return output
}

function isExceptionQuoraExceeded(e, storage) {
    return e instanceof DOMException && (
            // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        (storage && storage.length !== 0);
}

function setItemOnStorage(key, value, type) {
    var storageType = type || 'localStorage';
    var storage;
    try {
        storage = window[storageType];
        storage.setItem(key, value);
    } catch (e) {
        if (isExceptionQuoraExceeded(e, storage)) {
            removeElementsFromStorage();
            storage = window[storageType];
            storage.setItem(key, value);
        } else {
            throw e
        }
    }
}

function removeElementsFromStorage(type) {
    var storageType = type || 'localStorage';
    var storage = window[storageType]
    var fieldsToSave = ["lastCompareGraphInfo", "notifacationsShown"];
    var objToPreserve = [];
    fieldsToSave.forEach(field => {
        objToPreserve.push({key: field, value: storage.getItem(field)})
    })
    
    storage.clear();
    
    objToPreserve.forEach(obj => {
        if (obj.value) {
            setItemOnStorage(obj.key, obj.value, storageType);
        }
    })
}

function getItemFromStorage(key, type) {
    var storageType = type || 'localStorage';
    var storage = window[storageType];
    return storage.getItem(key);
}

function removeItemFromStorage(key, type) {
    var storageType = type || 'localStorage';
    var storage = window[storageType];
    storage.removeItem(key);
}

function setPresetOnStorage(template) {
    var presetStorage = getItemFromStorage('preset') ? JSON.parse(getItemFromStorage('preset')) : {};
    // limite massimo 5 template nello storage
    if (Object.keys(presetStorage).length >= 5){
        presetStorage = {};
    }
    presetStorage[template.id] = template;
    setItemOnStorage('preset', JSON.stringify(presetStorage));
}