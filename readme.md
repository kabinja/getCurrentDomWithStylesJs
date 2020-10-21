# Get the current DOM with the styles

# Objective

The goal of this function is to provide a simple way to extract the DOM of a webpage that can be contained in a single string.

## How does it work?

The function clones all the DOM elements of the current document. When cloning, the external CSS are loaded in a style element and all the computed css properties for each of the elements are inlined.

More precisely the following actions are performed:
- images are replaced by an empty square of the same size;
- scripts elements are ignored;
- link are either ignore or replaced by a style element if the are of the type stylesheet.

## How to use it?

getCurrentDomWithStyles does not take any arguments and returns a Promise that when resolved contains a string containing the entire dom with all the style elements.

Example of usage:

```javascript

    document.addEventListener('readystatechange', event => {
        getCurrentDomWithStyles().then(function (dom) {
            console.log(dom);
        });
    });

```

In this example the script is waiting for the page to be loaded, and then displays the computed current dom with styles in the console.

## Current limitations

- Style sheets located on the local storage (file://) cannot be loaded.
- URL's present for instance in style sheet for back ground image or in reference tags (<a>) are not handled at all.
- The script still might be slow for some usages