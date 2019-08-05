var myNotes = new Object();
let selectedColor = "white";
myNotes.db = null;

var idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
'use strict';
myNotes.open = function() {

    var request = idb.open('notes_db1', 1, function(upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains('notes')) {
            upgradeDb.createObjectStore('notes', {
                KeyPath: "timeStamp"
            });

        }

    });
    request.onupgradeneeded = function(event) {
        var db = event.target.result;
        db.createObjectStore("notes", {
            KeyPath: "timeStamp"
        });

    }
    request.onsuccess = function(e) {
        var version = 1;
        myNotes.db = e.target.result;
        var db = myNotes.db;
        console.log("Database version " + db.version);

        if (version != db.version) {
            var setVersionRequest = db.setVersion(version);
            setVersionRequest.onsuccess = function(e) {
                console.log("Successfully changed the version to " + db.version);
                var store = db.createObjectStore("notes", {
                    KeyPath: "timeStamp"
                });
            };
        }
        //This is for mozilla
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            if (db.objectStoreNames.contains("notes")) {
                var store = db.deleteObjectStore("notes");
            }

            var store = db.createObjectStore("notes", {
                keyPath: "timeStamp"
            });
        }

        myNotes.getAllNotes();
    };

    request.onerror = function(e) {
        console.log(e.target.errorCode);
    };
};

myNotes.addNote = function(todoText) {
    var db = myNotes.db;
    var trans = db.transaction(["notes"], 'readwrite');
    var store = trans.objectStore("notes");
    var timeStamp = new Date().getTime();
    var note = {
        "text": todoText,
        "color": selectedColor, //The bgcolor of the text
        "timeStamp": timeStamp
    };
    var request = store.add(note, timeStamp);

    request.onsuccess = function(e) {
        console.log("Note with timestamp " + e.target.result + " has been added!");
        $('#txt_note').val('');
        myNotes.newNote(note);
    };

    request.onerror = function(e) {
        console.log(e.target.errorCode);
    };
    $('#addnote').hide();
};

myNotes.getAllNotes = function() {
    var db = myNotes.db;
    var trans = db.transaction(["notes"], "readwrite");
    var store = trans.objectStore("notes");

    var curRequest = store.openCursor();
    var notes = [];

    curRequest.onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
            notes.push({
                "timeStamp": cursor.key,
                "text": cursor.value
            });
            cursor.continue();
        } else {
            var start = new Date().getTime();
            var notesCount = notes.length;
            for (var i = 0; i < notesCount; i++) {
                console.log("Item number " + i + " on " + notesCount);
                myNotes.displayNote(notes[i]);
            }
            var end = new Date().getTime();
            var total = end - start;
            console.log("Array processed in " + total + ' secs');
        }
    };
};

myNotes.newNote = function(note) {
    var notesDiv = $('#notes');
    var singleNote = $('<li style="background-color:' + note.color + '" class ="note"><i class="delete fa fa-trash"></i><i style="color:green;width:20px; height:20px" class="edit fa fa-edit"></i><p>' + note.text + '</p></li>');
    singleNote.find('.delete').click(function() {
        myNotes.deleteNote(note.timeStamp);
        singleNote.hide(function() {
            $(this).remove();
        });
    });
    singleNote.find('.edit').click(function() {
        myNotes.editNote(note.timeStamp);
        singleNote.hide(function() {
            $(this).remove();
        });
    });

    singleNote.hide();
    notesDiv.append(singleNote);
    singleNote.fadeIn();
};

myNotes.displayNote = function(note) {
    var notesDiv = $('#notes');
    var singleNote = $('<li style="background-color:' + note.text.color + '" class ="note"><i style="color:red;width:20px; height:20px" class="delete fa fa-trash"></i><i style="color:green;width:20px; height:20px" class="edit fa fa-edit"></i><p>' + note.text.text + '</p></li>');
    singleNote.find('.delete').click(function() {
        myNotes.deleteNote(note.timeStamp);
        singleNote.hide(function() {
            $(this).remove();
        });
    });
    singleNote.find('.edit').click(function() {
        myNotes.editNote(note.timeStamp);
        singleNote.hide(function() {
            $(this).remove();
        });
    });
    singleNote.hide();
    notesDiv.append(singleNote);
    singleNote.fadeIn();
};

myNotes.deleteNote = function(timestamp) {
    var db = myNotes.db;
    var trans = db.transaction(["notes"], "readwrite");
    var store = trans.objectStore("notes");
    var deleteRequest = store.delete(timestamp);

    deleteRequest.onsuccess = function(e) {
        console.log("Item successfully deleted");
    };
};

myNotes.editNote = function(timestamp) {
    var db = myNotes.db;
    var trans = db.transaction(["notes"], "readwrite");
    var store = trans.objectStore("notes");
    var editRequest = store.get(timestamp);

    editRequest.onsuccess = function(e) {
        let note = e.target.result;
        $('#addnote').slideDown();
        $('#txt_note').val(note.text);
        $('#btn_add').val("Update");
        $('#btn_add').attr('id', 'updtbtn');
        var color = note.color;
        var timeStamp = note.timeStamp;

        $('#updtbtn').click(function() {
            var db = myNotes.db;
            var trans = db.transaction(["notes"], "readwrite");
            var store = trans.objectStore("notes");
            var req = store.openCursor();
            req.onerror = function(event) {
                console.log("case if have an error");
            };

            req.onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (cursor.key.timeStamp == timeStamp) { //we find by id an note we want to update
                        var note = {
                            "text": $('#txt_note').val(),
                            "color": color,
                            "timeStamp": timeStamp
                        };
                        var res = cursor.update(note);
                        res.onsuccess = function(e) {
                            console.log("update success!!");
                        }
                        res.onerror = function(e) {
                            console.log("update failed!!");
                        }
                    }
                    cursor.continue();
                } else {
                    console.log("");
                }
            }

            $('#txt_note').val('');
            $('#btn_add').val("Save");
            $('#updtbtn').attr('id', 'btn_add');
            var request = store.put(note, timeStamp);

            request.onsuccess = function(e) {
                console.log("Note with timestamp " + e.target.result + " has been added!");
                var deleteRequest = store.delete(timestamp);
            };

            request.onerror = function(e) {
                console.log(e.target.errorCode);
            };
        });
        console.log("Item successfully opened for edit");
    };
};

$(document).ready(function() {

    myNotes.open();

    $('#btn_add').click(function() {
        var message = $('#txt_note').val();
        if (message !== "") {
            myNotes.addNote(message);
        }
    });

    $('.button').click(function() {
        var color = $(this).attr("data-value");
        $("#txt_note").css({
            "background-color": color
        });
        selectedColor = color;
    });

    $('#addnote').hide();
    $('.btn-fab').click(function() {
        $('#addnote').slideDown();
    });
});