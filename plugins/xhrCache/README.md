# jSQL.xhrCache

`xhrCache` is a framework-agnostic jSQL plugin that caches AJAX responses, and it's the best one around. It caches ajax responses directly from the underlying native XHR object (or Active X for those of you stuck in 1995). Responses are stored in DOMStorage so they will be persisted between page reloads.

## Usage

Usage is simple. Just include [jSQL.js](https://github.com/Pamblam/jSQL/blob/master/jSQL.js) and [jSQL.xhrCache.js](https://github.com/Pamblam/jSQL/blob/master/plugins/xhrCache/jSQL.xhrCache.js) in your app. Options are, well, optional. If you want to change them just throw them somewhere in your script.

## Options

xhrCache is meant to be dropped into any project and just work. To that end, there are only 2 configurable options: cache expiration time and whether or not to show a fake XHR request in the console when using cached responses.

### jSQL.xhrCache.max_age

You can set this to a the number of minutes a cached item is valid for. When any given cached responses is older than this number of minutes the request is made again and a fresh response will be cached. Default is 60.

    jSQL.xhrCache.max_age = 60;

### jSQL.xhrCache.logging

When this is set to `true`, the library will show a fake xhr request in the console for debugging. This is turned on by default.

    jSQL.xhrCache.logging = true;

### Clearing the cache

jSQL handles all the persistence and storage, so you can use the jSQL library directly to clear the cache:

    // Clear the xhrCache
    jSQL.tables = {};
    jSQL.persist();

## FAQs

#### I'm using jQuery/Dojo/Angular/my own custom library called bobQuery, can I use xhrCache?

Yep. xhrCache wraps the native XHR object or Active-X so it can be used unobtrusively with any library.

#### I'm making an app for my great great great grandma who runs IE8 on Windows 95, can I use this plugin?

Yep. Both jSQL and jSQL.xhrCache are cross browser compatible and meant to work on as many browsers as possible. Browser compatibility is listed on the [jSQL readme](https://github.com/Pamblam/jSQL#browser-support).

#### Pamblam, why are you such a cool dude?

I can't help it, I was born this way.

