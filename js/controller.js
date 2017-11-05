'use strict';
var appCtrl = angular.module("BarAppCtrl", []);



appCtrl.controller("InitCtrl", function ($scope, $location, $http) {
    var isbnArr = [];
    $(function () {
        // Create the QuaggaJS config object for the live stream
        var liveStreamConfig = {
            inputStream: {
                type: "LiveStream",
                constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    aspectRatio: { min: 1, max: 100 },
                    facingMode: "environment" // or "user" for the front camera
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: (navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4),
            decoder: {
                "readers": [
                    { "format": "ean_reader", "config": {} }
                ]
            },
            locate: true
        };
        // The fallback to the file API requires a different inputStream option. 
        // The rest is the same 
        var fileConfig = $.extend(
            {},
            liveStreamConfig,
            {
                inputStream: {
                    size: 800
                }
            }
        );
        // Start the live stream scanner when the modal opens
        $('#livestream_scanner').on('shown.bs.modal', function (e) {
            Quagga.init(
                liveStreamConfig,
                function (err) {
                    if (err) {
                        $('#livestream_scanner .modal-body .error').html('<div class="alert alert-danger"><strong><i class="fa fa-exclamation-triangle"></i> ' + err.name + '</strong>: ' + err.message + '</div>');
                        Quagga.stop();
                        return;
                    }
                    Quagga.start();
                }
            );
        });

        // Make sure, QuaggaJS draws frames an lines around possible 
        // barcodes on the live stream
        Quagga.onProcessed(function (result) {
            var drawingCtx = Quagga.canvas.ctx.overlay,
                drawingCanvas = Quagga.canvas.dom.overlay;

            if (result) {
                if (result.boxes) {
                    drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                    result.boxes.filter(function (box) {
                        return box !== result.box;
                    }).forEach(function (box) {
                        Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                    });
                }

                if (result.box) {
                    Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
                }

                if (result.codeResult && result.codeResult.code) {
                    Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
                }
            }
        });

        // Once a barcode had been read successfully, stop quagga and 
        // close the modal after a second to let the user notice where 
        // the barcode had actually been found.
        Quagga.onDetected(function (result) {
            if (result.codeResult.code) {
                $('#scanner_input').val(result.codeResult.code);
                //Write the value of scanned image into the search field
                $("#search_input").val($("#scanner_input").val());
                Quagga.stop();
                setTimeout(function () { $('#livestream_scanner').modal('hide'); }, 1000);
            }
        });

        // Stop quagga in any case, when the modal is closed
        $('#livestream_scanner').on('hide.bs.modal', function () {
            if (Quagga) {
                Quagga.stop();
            }
        });

        // Call Quagga.decodeSingle() for every file selected in the 
        // file input
        $("#livestream_scanner input:file").on("change", function (e) {
            if (e.target.files && e.target.files.length) {
                Quagga.decodeSingle($.extend({}, fileConfig, { src: URL.createObjectURL(e.target.files[0]) }), function (result) { alert(result.codeResult.code); });
            }
        });

       
        $(".search-button").on('click', function (e) {
            if ($("#search_input").val() == undefined || $("#search_input").val() == null || $("#search_input").val() == "") {
                console.log("error occured");
            } else {
                //go for search now
               // bookInfoObj.barCode = $("#search_input").val();
                isbnArr.push({ "u_isbn": $("#search_input").val() });
                console.log("Search the string", $("#search_input").val());
            }
        });
    });

    $scope.fillTable = function () {
       // alert("ok");
        $scope.dataArray = isbnArr;
    }
    var isbn_accessKey = "8CW9FT48";
    var googleBookApi = "https://www.googleapis.com/books/v1/volumes?q=ISBN:";
    var isbnDbApi = "http://isbndb.com/api/books.xml?access_key=" + isbn_accessKey + "&index1=isbn&value1=";
    $scope.isbn = "";
    $scope.getData = function (isbn) {
        $scope.isbn = isbn;
        var searchBookUrl = isbnDbApi + isbn;
        var searchBookObj = { url: isbnDbApi, isbn: isbn }
        var isbnSearchUrl_new = "./AjaxCaller/GetResponse";

        /***********************USE THE METHOD WHEN GOOOGLE SEARCH APIS ARE USED*********************/
        //$http.get(searchBookUrl).then(function (response) {
        //    console.log("book data is: ", response.data);

        //    var volumeData = response.data;
        //    if (volumeData.items.length >= 1) {
               
        //        $scope.dataArray.forEach(function (val, index) {
        //            if (val.u_isbn == isbn) {
        //                val.u_book_name = volumeData.items[0].volumeInfo.title;
        //                val.u_author_name = volumeData.items[0].volumeInfo.authors[0];
        //                console.log("books array is ", $scope.dataArray);
        //                return false;
        //            }
        //        });
        //    }
        //});

        /************************USE THE METHOD WHEN ISBN APIS ARE USED******************************/
        $http({
            method: "POST",
            async:true,
            url: "/AjaxCaller.aspx/GetRequest",
            data: JSON.stringify(searchBookObj)
        }).then(function (response) {
            if (response != undefined && response != null) {
                console.log("Api Data", response.data);
                if (response.data.d == "") {
                    console.log("Book not found at ISBN");
                } else {
                    var resData = response.data.d.split(":");
                    $scope.dataArray.forEach(function (val, index) {
                    if (val.u_isbn == isbn) {
                        val.u_book_name = resData[0];
                        val.u_author_name = resData[1];
                        console.log("books array is ", $scope.dataArray);
                        return false;
                    }
                });
                }
                
            }
            }, function (response) {
                console.log("error response", response);
        });
    }

    //addig the data to DB
   
    $scope.exportData = function (bookData) {
        console.log("post data is", bookData);
        var postData = angular.toJson(bookData);
        $http.post("https://dev44627.service-now.com/api/now/table/u_bookdb", postData, {
            withCredentials: true,
            headers: { 'Authrization': 'Basic' + btoa('admin' + ':' + 'Newzone1') }
        }).then(function (response) {
            if (response.status == "201") {
                console.log("Book" + bookData.u_book_name + "Added to DB");
                $scope.dbStatusBook = bookData.u_book_name;
                $("#db_upload").modal('show');
            } else {
                console.log("Error", response.data);
            }
        });
    }
  
});