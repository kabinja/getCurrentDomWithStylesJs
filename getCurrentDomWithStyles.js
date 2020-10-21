/**
 * @license
 * Copyright (c) 2020 Renaud Rwemalika.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/**
 * Get the entire dom with all the computed style as a self contained string.
 * 
 * CSS stylesheet are copied in the document, and computed style are inlined in the dom.
 * 
 * @returns {Promise.string}   Root element of the new clone containing all the styles.
 */
const getCurrentDomWithStyles = () => {
    const noStyleTags = new Set(['BASE', 'HEAD', 'HTML', 'META', 'NOFRAME', 'NOSCRIPT', 'PARAM', 'SCRIPT', 'STYLE', 'TITLE']);
    const ignoreTags = new Set(['SCRIPT', 'NOSCRIPT']);
    let defaultStylesCache = new Map();

    /**
     * Check if an Element node has a style defined to it.
     * 
     * @param {Element} node    Element for which to test if there is a style.
     * 
     * @returns {boolean}       True if the element 'node' has a style no otherwise.
     */
    function hasStyle(node) {
        return window.getComputedStyle(node, null) !== undefined;
    }


    /**
     * Gets the name for a css property of an element at a specified index. 
     * 
     * @param {Element} node    Element to which the property belongs to.
     * @param {integer} index   Position of the property in the list of css properties of the Element node.
     * 
     * @returns {string}        Name of the css property at position 'index' for element 'node'.
     */
    function getPropertyName(node, index) {
        return window.getComputedStyle(node, null).item(index);
    }


    /**
     * Gets the value for a css property of an element using its index. 
     * 
     * @param {Element} node    Element to which the property belongs to.
     * @param {string}  name    Name of the property.
     * 
     * @returns {string}        Value of the css property with name 'name' for element 'node'.
     */
    function getPropertyValue(node, property) {
        return window.getComputedStyle(node, null).getPropertyValue(property);
    }


    /**
     * Gets the number of css property for an element. 
     * 
     * @param {Element} node    Element to which the properties belongs to.
     * 
     * @returns {string}        Number of css properties defined for element 'node'.
     */
    function numberProperties(node) {
        return window.getComputedStyle(node, null).length;
    }


    /**
     * Checks if a value is empty.
     * 
     * To be considered as empty, a css property value could be either undefined, null or an empty string.
     * 
     * @param {string} value   Value that is being checked.
     * 
     * @returns {boolean}      True if the value is empty, false otherwise.
     */
    function isEmpty(value) {
        return value === undefined || value === null || value === '';
    }


    /**
     * Checks if a value is equal to the default style, computed by 'getDefaultStyle'.
     * 
     * @param {string}                cssPropName     Name of the property to be checked against.
     * @param {string}                propertyValue   Value of the property that is being checked for equality with default property.
     * @param {CSSStyleDeclaration}   defaultStyle    Default style declaration. See 'getDefaultStyle'.
     * 
     * @returns {boolean}                             True if the value is equal to the default style, false otherwise.
     */
    function isDefaultStyle(cssPropName, propertyValue, defaultStyle) {
        if(!defaultStyle){
            return false;
        }
        
        return propertyValue === defaultStyle.getPropertyValue(cssPropName);
    }


    /**
     * Get the default style for an element.
     * 
     * The default style corresponds to the style of an empty element for a specific tag, id and classes. 
     * Note that a cache is created and all the already computed default styles for a particular type of node are stored in 'defaultStylesCache'.
     * 
     * @param {Element} node            Element for which the default style needs to be computed.
     * 
     * @returns {CSSStyleDeclaration}   Default style of element 'node'.
     */
    function getDefaultStyle(node) {
        const key = JSON.stringify({
            tag: node.tagName,
            id: node.getAttribute('id'),
            classes: node.getAttribute('class') ? [node.getAttribute('class').split(' ')].sort() : []
        });

        if (!defaultStylesCache.has(key)) {
            defaultStylesCache.set(key, window.getComputedStyle(node, null));
        }

        return defaultStylesCache.get(key);
    }


    /**
     * Checks if an element has a specific tag name.
     * 
     * @param {Element} node    Element to which the tag name is being tested.
     * @param {string} tagname  Name of the tag to test against.
     * 
     * @returns {boolean}       True if the tag name of element 'node' matches 'tagname', false otherwise.
     */
    function hasTagName(node, tagName) {
        if (node.tagName === undefined) {
            return false;
        }

        return node.tagName.toUpperCase() === tagName.toUpperCase();
    }


    /**
     * Checks if an element has to be ignored during cloning.
     * 
     * Elements are ignored if they are undefined, do not have a tagname or belong to the ignore list 'ignoreTags'.
     * 
     * @param {Element} node    Element being tested.
     * 
     * @returns {boolean}       True if element 'node' is ignored during cloning, false otherwise.
     */
    function isIgnored(node) {
        if (node === undefined) {
            return true;
        }

        if (node.tagName === undefined) {
            return false;
        }

        return ignoreTags.has(node.tagName.toUpperCase());
    }


    /**
     * Checks if an element has style properties.
     * 
     * Elements are considered to have style properties if they have a tag name, and are NOT in the no style list 'noStyleTags'.
     * 
     * @param {Element} node    Element being tested.
     * 
     * @returns {boolean}       True if element 'node' has style properties, false otherwise.
     */
    function isComputeStyle(node) {
        if (node.tagName === undefined) {
            return false;
        }

        return node instanceof Element && !noStyleTags.has(node.tagName.toUpperCase());
    }


    /**
     * Returns a new empty image
     * 
     * Elements with tag name img keep the size, class, id and alt properties but lose all the others.
     * 
     * @param {Element} node            Element with tag name img.
     * 
     * @returns {Promise.Element}       Empty image keeping information about its size.
     */
    function computeImageNode(node) {
        const img = document.createElement('img');

        if (node.alt) {
            img.alt = node.alt;
        }

        if (node.id) {
            img.id = node.id;
        }

        img.width = node.width;
        img.height = node.height;
        img.class = node.class;

        return Promise.resolve(img);
    }


    /**
     * Returns a new style element if stylesheet or null if the link is ignored.
     * 
     * A new style element is created when dealing with style sheet. If the css rules are available locally, they are directly applied otherwise the css file is loaded.
     * 
     * @param {Element} node            Element with tag name link.
     * @param {boolean} importCss   Whether or not to import css style sheet or to inline on css properties
     * 
     * @returns {Promise.Element}       Style Element if link refers to a style sheet, null otherwise.
     */
    function computeLinkNode(node, importCss) {
        if (importCss && node.rel.toLowerCase() === 'stylesheet') {
            try {
                return getCss(node);
            }
            catch(e) {
                return loadCss(node);
            }
        }

        return Promise.resolve(null);
    }


    /**
     * Returns a new style element by reading the rules defined in the provided Element.
     * 
     * 
     * @param {Element} node            Element with tag name link and attribute rel set to stylesheet.
     * 
     * @returns {Promise.Element}       Style element created by reading the css rules defined in node.
     * @throws                          If CORS does not allow to access the css rules the function throws an exception.
     */
    function getCss(node) {
        let css = '';

        for (let i = 0; i < node.sheet.cssRules.length; ++i) {
            css.concat(node.sheet.cssRule[i], '\n');
        }

        const styleNode = document.createElement('style');
        styleNode.innerText = css;

        return Promise.resolve(node.sheet);
    }


    /**
     * Returns a new style element by downloading the css file using url defined in the provided Element.
     * 
     * 
     * @param {Element} node            Element with tag name link and attribute rel set to stylesheet.
     * 
     * @returns {Promise.Element}       Style element created by downloading a css style sheet and reject if the download fails.
     */
    async function loadCss(node) {
        try {
            const response = await fetch(node.href);

            const styleNode = document.createElement('style');
            styleNode.innerText = await response.text();

            return styleNode;
        }
        catch {
            return loadCssWithCorsAnywhere(node);
        }
    }

    /**
     * Returns a new style element by downloading the css file using url defined in the provided Element using the proxy cors-anywhere.
     * 
     * 
     * @param {Element} node            Element with tag name link and attribute rel set to stylesheet.
     * 
     * @returns {Promise.Element}       Style element created by downloading a css style sheet and reject if the download fails.
     */
    async function loadCssWithCorsAnywhere(node){
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const response = await fetch(proxyUrl + node.href);

        const styleNode = document.createElement('style');
        styleNode.innerText = await response.text();

        return styleNode;
    }

    /**
     * Update the style of the cloned element by using the one of the element being cloned.
     * 
     * 
     * @param {Element} clone       Target cloned element.
     * @param {Element} node        Source element to be cloned.
     * @param {boolean} importCss   Whether or not to import css style sheet or to inline on css properties
     * 
     * @returns {void}
     */
    function updateStyle(clone, node, importCss) {
        let defaultStyle = null;
        
        if(importCss){
            defaultStyle = getDefaultStyle(node);
        }
    
        const cssLength = numberProperties(node);

        clone.style = {};

        if (!hasStyle(node)) {
            return;
        }

        for (let i = 0, l = cssLength; i < l; ++i) {
            const cssPropName = getPropertyName(node, i);
            const cssPropValue = getPropertyValue(node, cssPropName);

            if (!isEmpty(cssPropValue) && !isDefaultStyle(cssPropName, cssPropValue, defaultStyle)) {
                clone.style[cssPropName] = cssPropValue;
            }
        }
    }


    /**
     * Recursively copy all the nodes of an element while inserting all the styles so they are contained in one string.
     * 
     * CSS stylesheet are copied in the document, and computed style are inlined in the dom.
     * 
     * @param {Element} node        Source element to be cloned
     * @param {boolean} importCss   Whether or not to import css style sheet or to inline on css properties
     * 
     * @returns {Promise.Element}   Root element of the new clone containing all the styles.
     */
    async function deepCloneWithStyles(node, importCss) {
        if (isIgnored(node)) {
            return Promise.resolve(null);
        }

        if(hasTagName(node, 'style') && !importCss){
            console.log('ignore style node');
            return Promise.resolve(null);
        }

        if (hasTagName(node, 'img')) {
            return computeImageNode(node);
        }

        if (hasTagName(node, 'link')) {
            return computeLinkNode(node, importCss);
        }

        const clone = node.cloneNode(false);

        if (isComputeStyle(node)) {
            updateStyle(clone, node, importCss);
        }

        for (let child of node.childNodes) {
            const cloneChild = await deepCloneWithStyles(child, importCss);
            
            if(cloneChild){
                clone.appendChild(cloneChild);
            }

        }

        return Promise.resolve(clone);
    }


    return (async () => {
        let clone = null;

        try{
            clone = await deepCloneWithStyles(document.documentElement, true);
        }
        catch(e){
            clone = await deepCloneWithStyles(document.documentElement, false);
        }

        return clone.outerHTML;
    })();
};