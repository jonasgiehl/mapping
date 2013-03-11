;(function(window, undefined) {

    "use strict";    

    Object.defineProperty(Object.prototype, 'extend', { 
        // enumerable defaults to false
        value: function (from) {
            var props = Object.getOwnPropertyNames(from),
                dest = this;
            props.forEach(function(name) {
                if (!(name in dest)) {
                    var destination = Object.getOwnPropertyDescriptor(from, name);
                    Object.defineProperty(dest, name, destination);
                }
            });
            return dest;
        }
    });

    (function(document) {

        var defaultEquipment = {
                image: 'img/computer.png',
                x: 0,
                y: 0,
                width: 48,
                height: 48
            };

        function getEquipmentData() {
            var data = {};
            $.each($('.attributes'), function() {
                var t = $(this), k = t.find('input.data-key').val(), v = t.find('input.data-value').val();
                if (k && v) {
                    data[k] = v;
                }
            });
            return data;
        }

        function loadEquipmentData(source) {
            var info = {
                id: source.id,
                x: source.x,
                y: source.y,
                height: source.height,
                width: source.width
            };

            var tx = "<p>";
            for (var d in info) {
                tx += "<span><strong>" + d.toUpperCase() + "</strong>: " + info[d] + "<span> | ";
            }
            tx = tx.substring(0, tx.length - 3) + "<p>";

            for (var d in source.data) {
                var it = source.data[d];
                tx += "<p><strong>" + d.toUpperCase() + "</strong>: ";

                if (it.substring(0, 4) == "http") {
                    tx += '<a href="' + it + '">' + it +'</a></p>';
                } else {
                    tx += it + "<p>";
                }
            }
            $('#equipment-data').html(tx).show();
        }

        function loadImages(sources) {
            var images = {},
                loadedImages = 0;

            for(var src in sources) {
                if (sources[src]) {
                    images[src] = new Image();
                    images[src].onload = function() {    
                        sources[loadedImages].image = images[loadedImages];        
                        if(++loadedImages == sources.length) {                        
                            initStage(sources);
                            console.log('Images Loaded');
                        }
                    };
                    images[src].src = sources[src].image;
                }
            }
        }

        function loadBackground(sources, background) {
            var strW = 1;
            layer = new Kinetic.Layer();

            layer.add(new Kinetic.Image({
                image: background,
                height: stage.getHeight() - (strW*2),
                width: stage.getWidth()- (strW*2),
                x: strW,
                y: strW,
                stroke: 'gray',
                strokeWidth: strW
            }));
            stage.add(layer);

            loadImages(sources);
        }

        function loadStage(sources) {
            var background = new Image();

            background.onload = function() {
                var w = this.width, 
                    mw = $('#mapping').width(),
                    width = w > mw ? mw : w,
                    height = (width / w) * this.height;

                stage = new Kinetic.Stage({
                                container: 'mapping',
                                width: width,
                                height: height
                });
                loadBackground(sources, this);
                console.log('Stage Ready - ', width, 'x', height);
            };
            background.src = 'img/planta.png';
        }


        function initStage(sources) {
            for (var src in sources) {
                var id = sources[src].id;
                imageObj[id] = new Kinetic.Image({
                    draggable: true
                }.extend(sources[src]));

                layer.add(imageObj[id]);

                imageObj[id].on('dragend', function(evt) {
                    var attrs = this.getAttrs();
                    instance.put({
                        id: attrs.id,
                        x: attrs.x,
                        y: attrs.y,
                        image: attrs.image.src,
                        height: attrs.height,
                        width: attrs.width,
                        data: attrs.data || {}
                    });
                });

                imageObj[id].on('dblclick', function(evt) {
                    loadEquipmentData.apply(this, [this.getAttrs()]);
                });

                // use event delegation to update pointer style
                imageObj[id].on('mouseover', function(evt) {
                    document.body.style.cursor = 'pointer'; 
                });
                imageObj[id].on('mouseout', function(evt) {
                    document.body.style.cursor = 'default';  
                });
                console.log('Object Loaded', id);
            }

            stage.add(layer);
        }

        function createObject(data) {
            var instance = this;
            instance.put(data, function(id) {
                loadImages.apply(instance, [[data.extend({id: id})]]);
            });
        }

        function getObjects() {
            this.getAll(function(data) {
                loadStage(data);
            });
        }

        $('#new-attribute').on('click', function() {
            var d = $('.attributes').first().clone();
            d.find('input').val('');
            $('.attributes').last().after(d);
        });

        $(document).on('.clean-attribute', 'click', function() {
            var parent = $(this).parent();
            if ($('.attributes').length > 1) {
                parent.remove();
            } else {
                parent.find('input').val('');
            }
        });


        $('#add-computer').on('click', function() {
            createObject.apply(instance, [{
                data: getEquipmentData()
            }.extend(defaultEquipment)]);
        });

        $('#add-notebook').on('click', function() {
            createObject.apply(instance, [{
                data: getEquipmentData(),
                image: 'img/macbook.png'
            }.extend(defaultEquipment)]);
        });

        $('#clear-db').on('click',  function() {
            if (confirm("Are you sure you want to clear the database?")) {
                instance.clear(function() {
                    for (var obj in imageObj) {
                        imageObj[obj].remove();
                    }
                    layer.draw();
                });
            }
        });

        var stage,
            layer,            
            imageObj = [],
            instance = new IDBStore({
                dbVersion: 1,
                storeName: 'equipments',
                keyPath: 'id',
                autoIncrement: true,
                onStoreReady: function() {
                    getObjects.apply(this);
                }
            });

    }(window.document));

}(window));