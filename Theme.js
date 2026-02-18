/*
    JS file for managing light / dark themes
    The toggle_theme(); function toggles the saved theme and updates the screen accordingly
    The remove_theme(); function removes the theme from localstorage and only updates the screen if it doesn't match the system settings
    The window.matchMedia(); function call watches for updates to system settings to keep localstorage settings accurate
*/

function get_system_theme() {
    /*
        Function for getting the system color scheme
    */

    theme = "dark";
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        theme = "light";
    }

    return theme;
}

function toggle_saved_theme() {
    /*
        Function for toggling between the two themes saved to local storage
        Returns:
            Value stored in local storage
    */

    // Gets Current Value
    if (localStorage.getItem("theme")) {
        theme = localStorage.getItem("theme");
    }
    else {
        theme = get_system_theme();
    }

    // Sets the stored value as the opposite
    if (theme === "light") {
        localStorage.setItem("theme", "dark");
    }
    else {
        localStorage.setItem("theme", "light");
    }

    return localStorage.getItem("theme");
}

function switch_theme_rules() {
    /*
        Function for switching the rules for perfers-color-scheme
        Goes through each style sheet file, then each rule within each stylesheet
        and looks for any rules that require a prefered colorscheme, 
        if it finds one that requires light theme then it makes it require dark theme / vise
        versa. The idea is that it will feel as though the themes switched even if they haven't. 
    */

    for (var sheet_file = 0; sheet_file < document.styleSheets.length; sheet_file++) {
        try {
            for (var sheet_rule = 0; sheet_rule < document.styleSheets[sheet_file].cssRules.length; sheet_rule++) {
                rule = document.styleSheets[sheet_file].cssRules[sheet_rule];

                if (rule && rule.media && rule.media.mediaText.includes("prefers-color-scheme")) {
                    rule_media = rule.media.mediaText;

                    if (rule_media.includes("light")) {
                        new_rule_media = rule_media.replace("light", "dark");
                    }
                    if (rule_media.includes("dark")) {
                        new_rule_media = rule_media.replace("dark", "light");
                    }
                    rule.media.deleteMedium(rule_media);
                    rule.media.appendMedium(new_rule_media);
                }
            }
        }
        catch (e) {
            broken_sheet = document.styleSheets[sheet_file].href;
            console.warn(broken_sheet + " broke something with theme toggle : " + e);
        }
    }
}

function toggle_theme() {
    /*
        Toggles the current theme used
    */
    stored_theme = toggle_saved_theme();
    switch_theme_rules();
}

function remove_theme() {
    /*
        Function for removing theme from local storage
    */
    if (localStorage.getItem("theme")) {
        if (get_system_theme() != localStorage.getItem("theme")) {
            switch_theme_rules();
        }
        localStorage.removeItem("theme");
    }
}

window.matchMedia('(prefers-color-scheme: dark)')
    /*
        This makes it such that if a user changes the theme on their
        browser and they have a preferred theme, the page maintains its prefered theme. 
    */
    .addEventListener("change", event => {
        if (localStorage.getItem("theme")) {
            switch_theme_rules(); // Switches Theme every time the prefered color gets updated
        }
    }
)

if (localStorage.getItem("theme")) {
    if (get_system_theme() != localStorage.getItem("theme")) {
        switch_theme_rules();
    }
}

var image_zoom_overlay = null;
var image_zoom_preview = null;
var image_zoom_caption = null;
var image_zoom_cleanup_token = 0;
var zoom_handlers_bound = false;
var zoom_pointer_target = null;
var zoom_pointer_x = 0;
var zoom_pointer_y = 0;

// Add more classes here if you want to whitelist multiple zoomable image groups.
var zoom_whitelist_classes = ["zoomable-image"];

function is_zoom_whitelisted(img) {
    if (!img) {
        return false;
    }

    for (var i = 0; i < zoom_whitelist_classes.length; i++) {
        if (img.classList.contains(zoom_whitelist_classes[i])) {
            return true;
        }
    }

    return false;
}

function should_enable_zoom_for_image(img) {
    if (!img || img.dataset.zoomDisabled === "true") {
        return false;
    }

    if (img.classList.contains("image-zoom-preview") || img.closest(".image-zoom-overlay")) {
        return false;
    }

    if (!img.src) {
        return false;
    }

    return is_zoom_whitelisted(img);
}

function get_zoomable_image_from_target(target) {
    if (!target || target.nodeType !== 1) {
        return null;
    }

    var image = target.closest("img");
    if (!should_enable_zoom_for_image(image)) {
        return null;
    }

    return image;
}

function ensure_image_zoom_overlay() {
    if (image_zoom_overlay) {
        return;
    }

    image_zoom_overlay = document.createElement("div");
    image_zoom_overlay.className = "image-zoom-overlay";
    image_zoom_overlay.setAttribute("aria-hidden", "true");

    var close_button = document.createElement("button");
    close_button.className = "image-zoom-close";
    close_button.setAttribute("type", "button");
    close_button.setAttribute("aria-label", "Close image preview");
    var close_button_icon = document.createElement("img");
    close_button_icon.src = "media/icons/close.svg";
    close_button_icon.alt = "";
    close_button_icon.setAttribute("aria-hidden", "true");
    close_button.appendChild(close_button_icon);

    image_zoom_preview = document.createElement("img");
    image_zoom_preview.className = "image-zoom-preview";
    image_zoom_preview.alt = "Expanded image";
    image_zoom_preview.setAttribute("draggable", "false");
    image_zoom_preview.addEventListener("dragstart", function (event) {
        event.preventDefault();
    });
    image_zoom_preview.addEventListener("error", function () {
        var jpg_fallback_src = image_zoom_preview.dataset.jpgFallbackSrc || "";
        var jpg_fallback_tried = image_zoom_preview.dataset.jpgFallbackTried === "true";
        var fallback_src = image_zoom_preview.dataset.fallbackSrc || "";
        var fallback_used = image_zoom_preview.dataset.fallbackUsed === "true";

        if (!jpg_fallback_tried && jpg_fallback_src && image_zoom_preview.src !== jpg_fallback_src) {
            image_zoom_preview.dataset.jpgFallbackTried = "true";
            image_zoom_preview.src = jpg_fallback_src;
            return;
        }

        if (!fallback_used && fallback_src && image_zoom_preview.src !== fallback_src) {
            image_zoom_preview.dataset.fallbackUsed = "true";
            image_zoom_preview.src = fallback_src;
        }
    });

    image_zoom_caption = document.createElement("p");
    image_zoom_caption.className = "image-zoom-caption";

    image_zoom_overlay.appendChild(close_button);
    image_zoom_overlay.appendChild(image_zoom_preview);
    image_zoom_overlay.appendChild(image_zoom_caption);
    document.body.appendChild(image_zoom_overlay);

    close_button.addEventListener("click", close_image_zoom);
    image_zoom_overlay.addEventListener("click", function (event) {
        if (event.target === image_zoom_overlay) {
            close_image_zoom();
        }
    });

    window.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            close_image_zoom();
        }
    });
}

function close_image_zoom() {
    if (!image_zoom_overlay || !image_zoom_overlay.classList.contains("open")) {
        return;
    }

    image_zoom_cleanup_token++;
    var cleanup_token = image_zoom_cleanup_token;

    image_zoom_overlay.classList.remove("open");
    image_zoom_overlay.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("image-zoom-open");

    // Delay source cleanup until fade-out is finished to avoid showing a broken-image icon.
    window.setTimeout(function () {
        if (!image_zoom_overlay || !image_zoom_preview) {
            return;
        }

        if (cleanup_token !== image_zoom_cleanup_token || image_zoom_overlay.classList.contains("open")) {
            return;
        }

        image_zoom_preview.removeAttribute("src");
        image_zoom_preview.dataset.jpgFallbackSrc = "";
        image_zoom_preview.dataset.jpgFallbackTried = "false";
        image_zoom_preview.dataset.fallbackSrc = "";
        image_zoom_preview.dataset.fallbackUsed = "false";
        image_zoom_caption.textContent = "";
    }, 140);
}

function open_image_zoom(img) {
    ensure_image_zoom_overlay();
    image_zoom_cleanup_token++;

    var preview_src = img.currentSrc || img.src;
    var full_size_src = get_full_size_image_src(preview_src);
    var jpg_fallback_src = get_jpg_fallback_image_src(full_size_src);

    image_zoom_preview.dataset.jpgFallbackSrc = jpg_fallback_src;
    image_zoom_preview.dataset.jpgFallbackTried = "false";
    image_zoom_preview.dataset.fallbackSrc = preview_src;
    image_zoom_preview.dataset.fallbackUsed = "false";
    image_zoom_preview.src = full_size_src;
    image_zoom_preview.alt = img.alt || "Expanded image";
    image_zoom_caption.textContent = img.alt || "";

    image_zoom_overlay.classList.add("open");
    image_zoom_overlay.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("image-zoom-open");
}

function get_full_size_image_src(preview_src) {
    if (!preview_src) {
        return preview_src;
    }

    var hash_index = preview_src.indexOf("#");
    var source_without_hash = hash_index === -1 ? preview_src : preview_src.slice(0, hash_index);
    var hash_part = hash_index === -1 ? "" : preview_src.slice(hash_index);
    var query_index = source_without_hash.indexOf("?");
    var path_part = query_index === -1 ? source_without_hash : source_without_hash.slice(0, query_index);
    var query_part = query_index === -1 ? "" : source_without_hash.slice(query_index);

    if (/_(w|h)\d+\.webp$/i.test(path_part)) {
        return path_part.replace(/_(w|h)\d+\.webp$/i, ".png") + query_part + hash_part;
    }

    if (/\.webp$/i.test(path_part)) {
        return path_part.replace(/\.webp$/i, ".png") + query_part + hash_part;
    }

    if (!/\.png$/i.test(path_part)) {
        return preview_src;
    }

    return path_part + query_part + hash_part;
}

function get_jpg_fallback_image_src(source) {
    if (!source) {
        return "";
    }

    var hash_index = source.indexOf("#");
    var source_without_hash = hash_index === -1 ? source : source.slice(0, hash_index);
    var hash_part = hash_index === -1 ? "" : source.slice(hash_index);
    var query_index = source_without_hash.indexOf("?");
    var path_part = query_index === -1 ? source_without_hash : source_without_hash.slice(0, query_index);
    var query_part = query_index === -1 ? "" : source_without_hash.slice(query_index);

    if (!/\.png$/i.test(path_part)) {
        return "";
    }

    return path_part.replace(/\.png$/i, ".jpg") + query_part + hash_part;
}

function handle_zoom_pointer_down(event) {
    var image = get_zoomable_image_from_target(event.target);
    if (!image) {
        zoom_pointer_target = null;
        return;
    }

    zoom_pointer_target = image;
    zoom_pointer_x = event.clientX;
    zoom_pointer_y = event.clientY;
}

function handle_zoom_pointer_end() {
    zoom_pointer_target = null;
}

function handle_zoom_click(event) {
    var image = get_zoomable_image_from_target(event.target);
    if (!image) {
        return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    if (zoom_pointer_target === image) {
        var moved_x = Math.abs(zoom_pointer_x - event.clientX);
        var moved_y = Math.abs(zoom_pointer_y - event.clientY);
        if (moved_x > 12 || moved_y > 12) {
            return;
        }
    }

    zoom_pointer_target = null;
    event.preventDefault();
    event.stopPropagation();
    open_image_zoom(image);
}

function ensure_zoom_handlers() {
    if (zoom_handlers_bound) {
        return;
    }

    zoom_handlers_bound = true;
    document.addEventListener("pointerdown", handle_zoom_pointer_down, true);
    document.addEventListener("pointerup", handle_zoom_pointer_end, true);
    document.addEventListener("pointercancel", handle_zoom_pointer_end, true);
    document.addEventListener("click", handle_zoom_click, true);
}

function initialize_image_zoom() {
    ensure_zoom_handlers();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize_image_zoom);
}
else {
    initialize_image_zoom();
}
