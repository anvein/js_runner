"use strict";

$(document).ready(function() {
    fillList();
    fillTags();
    jsFormatTextarea();
    // filterListItems();

    /**
     * Кнопка "Добавить скрипт (+)"
     */
    $("#addScript").click(function(e) {
        actionAddNewScript();
    });

    /**
     * Кнопка: "Закрытие окно редактирования" (x)
     */
    $("#addingScriptClose").click(function(e) {
        actionCloseScreenAdding();
    });

    /**
     * Кнопка: "Сохранить"
     */
    $("#addingScriptSave").click(function(e) {
        actionSaveScript();
    });


    /**
     * Action: добавление нового скрипта
     */
    function actionAddNewScript()
    {
        var addingScreen = $("#addingScript");

        addingScreen.addClass("active");
        addingScreen.find('#scriptName').val('');
        addingScreen.find('#scriptCode').val('');
        addingScreen.find('#scriptTag').val('');
        addingScreen.find('#scriptId').val('');
    }

    /**
     * Action: закрытие окна со скриптом
     */
    function actionCloseScreenAdding()
    {
        var addingScreen = $("#addingScript");
        addingScreen.removeClass("active");
    }

    /**
     * Asction: сохранение скрипта
     */
    function actionSaveScript()
    {
        var addingScreen = $("#addingScript");

        var code = addingScreen.find("#scriptCode").val();
        var title = addingScreen.find("#scriptName").val();
        var tag = addingScreen.find("#scriptTag").val();
        var id = addingScreen.find("#scriptId").val();

        if (title.length === 0) {
            alert('Не указано название');
            return;
        }

        chrome.storage.sync.get('scripts', function (obj) {
            var scripts;

            if (obj.scripts != null) {
                scripts = obj.scripts;
            } else {
                scripts = {};
            }

            if (id.length === 0) {
                id = guid();
            }

            scripts[id] = {
                'name': title,
                'tag': prepareTag(tag),
                'code': code
            };

            chrome.storage.sync.set({'scripts': scripts});

            addingScreen.removeClass("active");
            var scriptsList = $("#scriptsList .list-container");
            scriptsList.empty();

            fillList();
            fillTags();
        });
    }


    /**
     * Action: удаление скрипта
     * @param e
     */
    function actionDeleteScript(e)
    {
        var confirmDelete = confirm('Удалить скрипт?');
        if (!confirmDelete) {
           return;
        }

        chrome.storage.sync.get('scripts', function (obj) {
            var scripts;

            if (obj.scripts != null) {
                scripts = obj.scripts;
            } else {
                alert('Ошибка! Скрипт не найден..');
                return;
            }

            var id = e.target.parentNode.getAttribute('data-id');

            if (scripts[id] === null) {
                alert('Ошибка! Скрипт не найден..');
            }

            delete scripts[id];

            chrome.storage.sync.set({'scripts': scripts});

            var scriptsList = $("#scriptsList .list-container");
            scriptsList.empty();

            fillList();
            fillTags();
        });
    }

    /**
     * Переход к редактированию скрипта
     */
    function actionToEditScript(e)
    {
        var addingScreen = $("#addingScript");

        chrome.storage.sync.get('scripts', function (obj) {
            var scripts;

            if (obj.scripts != null) {
                scripts = obj.scripts;
            } else {
                alert('Ошибка! Скрипт не найден..');
                return;
            }

            var id = e.target.parentNode.getAttribute('data-id');

            if (scripts[id] === null) {
                alert('Ошибка! Скрипт не найден..');
            }

            var script = scripts[id];

            addingScreen.find('#scriptName').val(script.name);
            addingScreen.find('#scriptCode').val(script.code);
            addingScreen.find('#scriptTag').val(script.tag);
            addingScreen.find('#scriptId').val(id);

            addingScreen.addClass("active");
        });
    }

    /**
     * Копировать текст заметки
     */
    function actionCopyTextScript(e)
    {
        chrome.storage.sync.get('scripts', function (obj) {
            var scripts;

            if (obj.scripts != null) {
                scripts = obj.scripts;
            } else {
                alert('Ошибка! Скрипт не найден..');
                return;
            }

            var id = e.target.parentNode.getAttribute('data-id');

            if (scripts[id] === null) {
                alert('Ошибка! Скрипт не найден..');
            }

            var script = scripts[id];
            copy(script.code);
        });
    }

    /**
     * Запустить скрипт
     */
    function actionRunScript(e)
    {
        chrome.storage.sync.get('scripts', function (obj) {
            var scripts;

            if (obj.scripts != null) {
                scripts = obj.scripts;
            } else {
                alert('Ошибка! Скрипт не найден..');
                return;
            }

            var id = e.target.parentNode.getAttribute('data-id');

            if (scripts[id] === null) {
                alert('Ошибка! Скрипт не найден..');
            }

            var script = scripts[id];

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.executeScript({"file": "jquery.js"});

                chrome.tabs.executeScript({"code": script.code});
            });
        });
    }


    function injectCode(code) {
        var injectedCode = code;
        var script = document.createElement('script');
        script.appendChild(document.createTextNode('' + injectedCode + ''));
        document.head.appendChild(script);
    }

    function copy(str){
        let tmp   = document.createElement('input'),
            focus = document.activeElement;

        tmp.value = str;

        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        focus.focus();
    }


    /**
     * Наполнение списка
     */
    function fillList()
    {
        chrome.storage.sync.get('scripts', function (obj) {
            var scripts;

            if (obj.scripts != null) {
                scripts = obj.scripts;
            } else {
                scripts = {};
            }

            var scriptsList = $("#scriptsList #listContainer");
            scriptsList.empty();

            for (var key in scripts) {
                var element = $('<div class="scripts-list_item">' +
                    '<span class="title">' + scripts[key].name + '</span>' +
                    '<span class="delete" title="Удалить"></span>' +
                    '<span class="copy"  title="Скопировать код"></span>' +
                    '<span class="run"  title="Запустить скрипт"></span>' +
                    '</div>');

                element.attr('data-tag', scripts[key]['tag']);
                element.attr('data-id', key);

                scriptsList.append(element);
            }

            registerItemListActions();
        });
    }

    /**
     * Делает, чтобы в поле ввода для скрипта подсвечивался синтаксис js
     */
    function jsFormatTextarea()
    {

    }

    /**
     * Наполнение блока с тегами
     */
    function fillTags()
    {
        chrome.storage.sync.get('scripts', function (obj) {
            var scripts;

            if (obj.scripts != null) {
                scripts = obj.scripts;
            } else {
                scripts = {};
            }

            var tags = [];
            for (var key in scripts) {
                if (scripts[key].tag !== null && scripts[key].tag !== '' && tags.indexOf(scripts[key].tag) === -1) {
                    tags[scripts[key].tag] = scripts[key].tag;
                }
            }

            var divTagsList = $('#mainContainer #tagsList');
            divTagsList.empty();
            for (var tag in tags) {
                divTagsList.append('<span class="tag" data-tag="' + tag + '">' + tag + '</span>');
            }

            registerItemListTags();
        });
    }

    /**
     * Добавляет кнопку на страницу
     */
    function addRunButton()
    {
        var btn = document.createElement('div');
        btn.innerHTML = '<?xml version="1.0" ?>' +
            '<svg fill="#00bf79" id="blue_copy" style="enable-background:new 0 0 100 100;" version="1.1" viewBox="0 0 100 100" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
            '<g>' +
                '<path d="M31.356,25.677l38.625,22.3c1.557,0.899,1.557,3.147,0,4.046l-38.625,22.3c-1.557,0.899-3.504-0.225-3.504-2.023V27.7   C27.852,25.902,29.798,24.778,31.356,25.677z"/>' +
                '<path d="M69.981,47.977l-38.625-22.3c-0.233-0.134-0.474-0.21-0.716-0.259l37.341,21.559c1.557,0.899,1.557,3.147,0,4.046   l-38.625,22.3c-0.349,0.201-0.716,0.288-1.078,0.301c0.656,0.938,1.961,1.343,3.078,0.699l38.625-22.3   C71.538,51.124,71.538,48.876,69.981,47.977z"/>' +
                '<path d="M31.356,25.677l38.625,22.3c1.557,0.899,1.557,3.147,0,4.046   l-38.625,22.3c-1.557,0.899-3.504-0.225-3.504-2.023V27.7C27.852,25.902,29.798,24.778,31.356,25.677z" style="fill:none;stroke:#00bf79;stroke-miterlimit:10;"/>' +
            '</g>' +
        '</svg>';
        btn.setAttribute('onclick', 'alert("атата");');
        btn.setAttribute('styles', "color: red");

        document.body.appendChild(btn);
    }


    /**
     * Регистрация функций связанных с элементами списка
     */
    function registerItemListActions()
    {
        /**
         * Кнопка: правка элемента
         */
        $("#listContainer .scripts-list_item .title").on('dblclick', function(e1) {
            actionToEditScript(e1);
        });

        /**
         * Action: удаление элемента
         */
        $("#listContainer .scripts-list_item .delete").on('click', function(e2) {
            actionDeleteScript(e2);
        }) ;

        /**
         * Кнопка: копировать
         */
        $("#listContainer .scripts-list_item .copy").on('click', function(e3) {
            actionCopyTextScript(e3);
        });

        /**
         * Кнопка: запустить скрипт
         */
        $("#listContainer .scripts-list_item .run").on('click', function(e4) {
            actionRunScript(e4);
        });
    }

    function registerItemListTags()
    {
        /**
         * Клик по тегу
         */
        $("#scriptsList #tagsList .tag").on('click', function(e) {
            activationTag(e);
            filterListItems();
        });
    }

    /**
     * Фильтрация элементов по активным тегам
     */
    function filterListItems() {
        var activeTag = $('#tagsList .active');

        var listItems = $('#listContainer .scripts-list_item');
        if (listItems.length === 0) {
            return;
        }

        if (activeTag.length === 0) {
            listItems.each(function(ind, element) {
                element.classList.remove('hide');
            });
        } else {
            listItems.each(function(ind, element) {
                if (element.getAttribute('data-tag') !== activeTag.attr('data-tag')) {
                    element.classList.add('hide');
                } else {
                    element.classList.remove('hide');
                }

            });
        }
    }

    /**
     * Активация / деактивация тегов
     */
    function activationTag(e)
    {
        var tags = $('#tagsList .tag');

        var nowTagEl = $(e.target);
        var nowTagKey = nowTagEl.attr('data-tag');

        tags.each(function(ind, element) {
            if (nowTagKey === element.getAttribute('data-tag')) {
                if (nowTagEl.hasClass('active')) {
                    nowTagEl.removeClass('active');
                } else {
                    nowTagEl.addClass('active');
                }
            } else {
                if (element.classList.contains('active')) {
                    element.classList.remove('active');
                }
            }
        });
    }

    /**
     * Генерит guid
     * @returns {string}
     */
    function guid()
    {
        var s = [];
        var hexDigits = "0123456789ABCDEF";
        for (var i = 0; i < 32; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

        var guid = s.join("");
        return guid;
    }

    /**
     * Подготавливает тег
     *
     * @param tag
     * @returns {string}
     */
    function prepareTag(tag)
    {
        if (tag.length === 0) {
            return '';
        }

        tag = tag.toLowerCase().replace(' ', '');
        if (tag[0] !== '#') {
            tag = '#' + tag;
        }

        return tag;
    }

});