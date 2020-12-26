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
 * @returns {Promise<string>}   Root element of the new clone containing all the styles.
 */
const getCurrentDomWithStyles = async () => {
    const noStyleTags = new Set(['BASE', 'HEAD', 'HTML', 'META', 'NOFRAME', 'NOSCRIPT', 'PARAM', 'SCRIPT', 'STYLE', 'TITLE', 'LINK']);
    const ignoreTags = new Set(['SCRIPT', 'NOSCRIPT', 'STYLE']);
    let defaultStylesCache = new Map();

    async function initializeStyleSheets(){
        const sheets = [];

        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];
            let rules = [];

            try{
                rules = styleSheet.cssRules;
            }
            catch {
                rules = await loadCss(styleSheet.href);
            }
            
            sheets.push(rules);
        }

        return Promise.resolve(sheets);
    }

    /**
     * Returns a new style element by downloading the css file using url defined in the provided Element.
     * 
     * 
     * @param {Element} node            Element with tag name link and attribute rel set to stylesheet.
     * 
     * @returns {Promise<CssRuleList>}       Style element created by downloading a css style sheet and reject if the download fails.
     */
    async function loadCss(href) {
        let css = '';
        try {
            const response = await fetch(href);
            css = response.text();
        }
        catch (e) {
            css = await loadCssWithCorsAnywhere(href);
        }

        const doc = document.implementation.createHTMLDocument("");
        const styleElement = document.createElement('style');
        styleElement.textContent = css;
        
        const style = doc.body.appendChild(styleElement);

        return Promise.resolve(style.sheet.cssRules);        
    }

    /**
     * Returns a new style element by downloading the css file using url defined in the provided Element using the proxy cors-anywhere.
     * 
     * 
     * @param {string} href            Element with tag name link and attribute rel set to stylesheet.
     * 
     * @returns {Promise<Element>}       Style element created by downloading a css style sheet and reject if the download fails.
     */
    async function loadCssWithCorsAnywhere(href){
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const response = await fetch(proxyUrl + href);
        return response.text();
    }
    
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

        return node.tagName.toLowerCase() === tagName.toLowerCase();
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

        if(isEmptyTextNode(node)){
            return true;
        }

        if (node.tagName === undefined) {
            return false;
        }

        return ignoreTags.has(node.tagName.toUpperCase());
    }

     /**
     * Checks if an element is an empty text node
     * 
     * Elements are considered to be empty text node if they only contain blank characters, meaning white space and charriage characters
     * 
     * @param {Element} node    Element being tested.
     * 
     * @returns {boolean}       True if element 'node' is of type TEXT_NODE and only contain blank characters, false otherwise.
     */
    function isEmptyTextNode(node){
        if(node.nodeType !== Node.TEXT_NODE){
            return false;
        }

        if((node.previousElementSibling && hasTagName(node.previousElementSibling, 'span')) || (node.nextElementSibling && hasTagName(node.nextElementSibling, 'span'))) {
            return false;
        }

        const length = node.nodeValue.length;
        let index = 0;

        while(index < length) {
            if(!isBlankCharacter(node.nodeValue.charCodeAt(index++))){
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if a character is a blank character
     * 
     * A charactere is considered blank if it is either a white space or charriage characters
     * 
     * @param {int} charCode    UTF-8 code of the character
     * 
     * @returns {boolean}       True if 'charCode' is a blank space, False otherwie.
     */
    function isBlankCharacter(charCode) {
        return 9 === charCode || 32 === charCode || 0xB === charCode || 0xC === charCode || 10 === charCode || 13 === charCode;
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
     * @returns {Element}       Empty image keeping information about its size.
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

        return img;
    }

    /**
     * Update the style of the cloned element by using the one of the element being cloned.
     * 
     * 
     * @param {Element} clone       Target cloned element.
     * @param {Element} node        Source element to be cloned.
     * 
     * @returns {void}
     */
    function updateStyle(clone, node) {
        let defaultStyle = getDefaultStyle(node);    
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
     * 
     * @returns {Element}   Root element of the new clone containing all the styles.
     */
    function deepCloneWithStyles(node) {
        if (isIgnored(node)) {
            return null;
        }

        if (hasTagName(node, 'img')) {
            return computeImageNode(node);
        }

        const clone = node.cloneNode(false);

        if (isComputeStyle(node)) {
            updateStyle(clone, node);
        }

        for (let child of node.childNodes) {
            const cloneChild = deepCloneWithStyles(child);
            
            if(cloneChild){
                clone.appendChild(cloneChild);
            }

        }

        return clone;
    }

    function finalize(node, styleSheets){
        const doc = document.implementation.createDocument("", "", document.doctype);
        doc.appendChild(node);

        if(document.head === undefined){
            const html = document.getElementsByTagName('html')[0];
            html.appendChild(document.createElement('head'));
        }

        const allNodes = doc.querySelectorAll('*');

        for(let rules of getUsedStyles(styleSheets, allNodes)){
            if(rules.length == 0){
                continue;
            }

            const sortedRules = Array.from(new Map([...rules.entries()].sort()).values());

            const usedStyle = document.createElement('style');
            usedStyle.textContent = sortedRules.join(' ');
            doc.head.appendChild(usedStyle);
        }

        return doc;
    }

    function getUsedStyles(styleSheets, nodes) {
        const used = [];

        for (let i = 0; i < styleSheets.length; ++i) {
            used.push(new Map());
        }

        for (let i in styleSheets) {
            const rules = styleSheets[i];
            for (let r = 0; r < rules.length; ++r) {
                if (!used[i].has(r) && document.querySelectorAll(rules[r].selectorText).length > 0) {
                    used[i].set( r, rules[r].cssText);
                }
            }
        }

        return used;
    }

    async function createDomElements(){
        const styleSheets = initializeStyleSheets();
        
        const clone = deepCloneWithStyles(document.documentElement);

        return Promise.all([Promise.resolve(clone), styleSheets]);
    }

    function createErrorDocument(error){
        const doc = document.implementation.createDocument("", "", document.doctype);

        const htmlNode = document.createElement('html');
        const bodyNode = document.createElement('body');
        htmlNode.appendChild(bodyNode);
        bodyNode.innerHTML = error;
        doc.appendChild(htmlNode);

        return htmlNode;
    }

    return (async () => {
        let doc;

        try{
            [rootNode, styleSheets] = await createDomElements();
            doc = finalize(rootNode, styleSheets);
        }
        catch(e){
            doc = createErrorDocument(e);
        }

        const ns = new XMLSerializer();
        return ns.serializeToString(doc);;
    })();
};