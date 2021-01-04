
/*
* Gets value supplied by user during demographics collection
* Only works when passed to demographics on_finish parameter
* */

function get_demographic(param) {
    return JSON.parse(jsPsych.data.get().values()[2].responses)[param]
}

/**
 * @desc Shuffles array in place. (https://stackoverflow.com/a/6274381/1097977)
 * @param {Array} arr items An array containing the items.
 */
function array_shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }
    return arr;
}

if (!Array.prototype.endwards) {
    Array.prototype.endwards = function(negative_index) {
        if (Math.abs(negative_index) > this.length) throw(ValueError("Requested index outside array range"));
        return negative_index < 0 ? this[this.length + negative_index] : this[this.length - negative_index];
    }
}

/**
 * sprintf() method for String primitive type
 */
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

/**
 * @desc Returns random element from array
 * @param {Array} arr An array of items.
 * */
function randomChoice(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

/**
 * @desc Returns random int selected from interval [min, max), both ends inclusive
 * @param min lower bound, inclusive
 * @param max upper bound, inclusive
 */
function ranged_random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @desc Given length of some array, returns dimensions of grid of best fit.
 * @param n length of array to be arranged in grid
 */
function best_grid(n) {
    x = Math.floor(Math.sqrt(n));
    y = Math.ceil(n/x);
    return [x, y];
}

/**
 * pr method
 *
 * @desc Elaborated print statement for use with Chrome console
 * @param obj
 * @param label
 * @param error
 * @returns {*}
 */
function pr(obj, label, error) {
    var stacktrace = new Error().stack.split("\n").slice(2);
//		console.log(stacktrace);
    var stack = [];
    var func = "Null";
    var file = "//nowhere";
    var line_no = "-1";
    for (var i = 0; i < stacktrace.length - 1; i++) {
        try {
            func = stacktrace[i].match(/^ at (.*) \(/)[1];
        } catch (e) {}
        try {
            file = "/" + stacktrace[i].match(/^.*\/\/[a-z.-]*\/(.*):[0-9]*:[0-9]*/)[1];
        } catch (e) {}
        ;

        try {
            line_no = stacktrace[i].match(/^.*\/\/[a-z.-]*\/.*:([0-9]*):[0-9]*/)[1];
        } catch (e) {}
        stack.push(func + " in  " + file + ":" + line_no);
    }
    console.log("\nPrinting From: " + stack[0] + "\n");

    var method = error  ? "error" : "log";
    label = !!label && typeof(label) === "string" ? "%c " + label + " " : '%c';
    var note_delim = "*";
    var note_delim_length = note_delim.length;
    var label_bg = "rgb(52, 61, 76)";
    var label_border = "rgb(28, 37 40)";
    var ins_color = "rgb(247, 126, 239)";
    switch (error) {
        case 1:
            var label_css = "color:rgb(255,0,0); text-transform:uppercase; background-color:rgb(255,245,245); border:1px solid rgb(255,0,0);";
            break;
        case 2:
            var label_left_css = "color:rgb(100,160,175); background-color:" + label_bg + "; border:1px solid rgb(35,55,63); border-right:none;";
            var label_center_css = "color:rgb(100,160,175); background-color:" + label_bg + "; border:1px solid rgb(35,55,63); border-left:none, border-right:none;";
            var label_right_css = "color:rgb(100,160,175); background-color:" + label_bg + "; border:1px solid rgb(35,55,63); border-left:none;";
            var label_ins_replace = label.replace("[", "__LBRAC__");
            var label_ins_replace = label_ins_replace.replace("]", "__RBRAC__");
            var label_ins_replace = label_ins_replace.replace(/__LBRAC__(.*)__RBRAC__/, "[%c$1%c]");
            var instances = false;
            var internal_to_method = false;
            if (label != label_ins_replace) {
                label = label_ins_replace;
                instances = true;
            }
            label = label.replace(/\((.*)\)/, "(%c$1%c) %c");
            var meth_label = label.replace(/(#)/, "%c#%c %c");
            if (meth_label != label) {
                internal_to_method = true;
                label = meth_label;
            }
            break;
        default:
            var label_css = "color:rgb(0,150,0); text-transform:uppercase; background-color:rgb(245,245,245); border:1px solid rgb(220,220,220);";
    }
    var type_css = "color:rgb(200,200,200); font-style:italics; display:inline-block; width: 12px; min-width:12px; max-width:12px;";
    var num_css = "color:rgb(0,0,100);";
    var bool_css = "color:rgb(225,125,80); font-weight: bold";
    var str_css = "color:rgb(125,125,125); font-family:arial";
    var note_css = "color:#008cba; background-color:rgb(247,247,247); border:1px solid #008cba;";
    var arg_css = "color:rgb(252,122,0); background-color:" + label_bg + "; border-top:1px solid rgb(35,55,63); border-bottom:1px solid rgb(35,55,63);";
    var ins_css = "color:" + ins_color + "; background-color:" + label_bg + "; border-top:1px solid rgb(35,55,63); border-bottom:1px solid rgb(35,55,63);";
    var msg_css = "color:rgb(252,240,244); background-color:" + label_bg + "; border-top:1px solid rgb(35,55,63); border-bottom:1px solid rgb(35,55,63);";
    var debug = error == 2 || error == 3;
    if (debug) {
        switch (obj) {
            case obj === false:
                label += "%s";
                obj = "false";
                break;
            case obj === true:
                label += "%s";
                obj = "true";
                break;
            case obj === null:
                label += "%s"
                obj = "null"
                break;
            case typeof(obj) === 'undefined':
                label += "%s"
                obj = "undefined"
                break;
            case typeof(obj) === 'number':
                break;
            default:
                label += "%O";
        }
        if (instances) {
            console[method](label, label_left_css, ins_css, label_center_css, arg_css, label_right_css, msg_css, obj);
        } else {
            console[method](label, label_left_css, arg_css, label_right_css, msg_css, obj);
        }
    } else {
        switch (obj) {
            case obj === 0:
                console[method](label + "%c(int) %c", label_css, type_css, num_css, 0);
                break;
            case obj === 1:
                console[method](label + "%c(int) %c%s", label_css, type_css, num_css, 1);
                break
            case obj === false:
                console[method](label + "%c(bool) %c%s", label_css, type_css, bool_css, "false");
                break;
            case obj === true:
                console[method](label + "%c(bool) %c%s", label_css, type_css, bool_css, "true");
                break;
            case obj === null:
                console[method](label + "%c(!def) %c%s", label_css, type_css, bool_css, "null");
                break;
            case typeof(obj) === 'undefined':
                console[method](label + "%c(!def) %c%s", label_css, type_css, bool_css, "undefined");
                break;
            case typeof(obj) === 'string':
                if (obj.substring(0, note_delim_length) === note_delim) {
                    console[method](label + "%c%s", label_css, note_css, " " + obj.substring(1) + " ");
                } else {
                    console[method](label + "%c(str) %c%s", label_css, type_css, str_css, obj);
                }
                break;
            case typeof(obj) === 'number':
                obj % 1 === 0 ? console[method](label + "%c(int) %c%s", label_css, type_css, num_css, obj) : console[method](label + "%c(float) %c%s", label_css, type_css, num_css, obj);
                break;
            default:
                console[method](label + "%c(obj) %O", label_css, type_css, obj);
        }
    }


    return null;
}
