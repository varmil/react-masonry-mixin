var isBrowser = (typeof window !== 'undefined');
var Masonry = isBrowser ? window.Masonry || require('masonry') : null;
var imagesloaded = isBrowser ? require('imagesloaded') : null;

function MasonryMixin() {
    return function(reference, options) {
        return {
            masonry: false,

            domChildren: [],

            initializeMasonry: function(force) {
                if (!this.masonry || force) {
                    this.masonry = new Masonry(this.refs[reference].getDOMNode(), options);
                }
            },

            diffDomChildren: function() {
                var oldChildren = this.domChildren;
                var newChildren = Array.prototype.slice.call(this.refs[reference].getDOMNode().children);

                var removed = oldChildren.filter(function(oldChild) {
                    return !~newChildren.indexOf(oldChild);
                });

                var added = newChildren.filter(function(newChild) {
                    return !~oldChildren.indexOf(newChild);
                });

                var moved = [];

                if (removed.length === 0) {
                    moved = oldChildren.filter(function(child, index) {
                        return index !== newChildren.indexOf(child);
                    });
                }

                this.domChildren = newChildren;

                return {
                    old: oldChildren,
                    new: newChildren,
                    removed: removed,
                    added: added,
                    moved: moved
                };
            },

            shouldPerformLayout: function() {
                var diff = this.diffDomChildren();
                var reloadItemsFlag = false;
                var layoutFlag = false;

                if (diff.removed.length > 0) {
                    this.masonry.remove(diff.removed);
                    reloadItemsFlag = true;
                }

                if (diff.added.length > 0) {
                    this.masonry.addItems(diff.added);
                    layoutFlag = true;
                }

                if (diff.moved.length > 0) {
                    reloadItemsFlag = true;
                }

                if (reloadItemsFlag) {
                    this.masonry.reloadItems();
                    layoutFlag = true;
                }

                return layoutFlag;
            },

            // TODO imagesloaded has a problem of memory leak.
            imagesLoaded: function(callback) {
                return imagesloaded(this.refs[reference].getDOMNode());
            },

            componentDidMount: function() {
                if (!isBrowser) return;
                var self = this;

                // Insert because there already exists initial DOM.
                this.domChildren = Array.prototype.slice.call(this.refs[reference].getDOMNode().children);

                this.initializeMasonry();
                this.imagesLoaded().once('always', function(instance) {
                    self.masonry.layout();
                });
            },

            componentDidUpdate: function() {
                if (!isBrowser) return;
                var self = this;

                var bool = this.shouldPerformLayout();
                this.imagesLoaded().once('always', function(instance) {
                    if (bool) self.masonry.layout();
                });
            }
        };
    };
}

module.exports = MasonryMixin();
