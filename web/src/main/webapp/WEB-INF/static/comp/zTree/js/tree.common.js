$.zTree = {
    index : 1,
    treeTemplate :
        '<ul id="treeSelect{id}" class="ztree"></ul>',

    selectTreeTemplate :
        '<div id="treeContent{id}" class="treeContent" style="display:none; position: absolute;">{tree}</div>',

    autocompleteTemplate :
        '<div class="control-group tree-search" style="margin-top:5px;">' +
            '<label for="searchName{id}">名称</label>' +
            '<div class="controls">' +
            '<input type="text" id="searchName{id}" class="input-medium" placeholder="模糊匹配 回车键查询"/>' +
            '</div>' +
        '</div>',

    /**
     * 初始化可移动树
     */
    initMovableTree : function(config) {

        config.renameUrl = config.renameUrl || (config.urlPrefix + "/ajax/rename/{id}?newName={newName}");
        config.removeUrl = config.removeUrl || (config.urlPrefix + "/ajax/delete/{id}");
        config.addUrl = config.addUrl || (config.urlPrefix + "/ajax/appendChild/{id}");
        config.moveUrl = config.moveUrl || (config.urlPrefix + "/ajax/move/{sourceId}/{targetId}/{moveType}");
        config.loadUrl = config.loadUrl || (config.urlPrefix + "/ajax/load" + "?async=" + config.async + (config.excludeId ? "&excludeId=" + config.excludeId : ""));

        var setting = {
            async: {
                enable: config.async,
                url: config.loadUrl,
                autoParam:["id"],
                dataFilter: $.zTree.filter
            },
            view: {
                addHoverDom: addHoverDom,
                removeHoverDom: removeHoverDom,
                selectedMulti: false
            },
            edit: {
                enable: true,
                editNameSelectAll: true,
                showRemoveBtn : function(treeId, treeNode) {return !treeNode.root;},
                showRenameBtn: true,
                removeTitle: "移除",
                renameTitle: "重命名",
                drag : {
                    prev: drop,
                    inner: drop,
                    next: drop
                }
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            callback:{
                beforeRemove: function(treeId, treeNode) { return confirm("确认删除吗？")},
                beforeRename : beforeRename,
                onRemove: onRemove,
                onRename: onRename,
                onDrop : onDrop
            }
        };


        function drop(treeId, nodes, targetNode) {
            if(!targetNode || !targetNode.getParentNode()) {
                return false;
            }
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (nodes[i].root === true) {
                    return false;
                }
            }
            return true;
        }


        function addHoverDom(treeId, treeNode) {
            var sObj = $("#" + treeNode.tId + "_span");
            if (treeNode.editNameFlag || $("#addBtn_" + treeNode.id).length > 0) return;
            var addStr = "<span class='button add' id='addBtn_" + treeNode.id
                + "' title='添加子节点' onfocus='this.blur();'></span>";
            sObj.after(addStr);
            var btn = $("#addBtn_" + treeNode.id);
            if (btn)
                btn.bind("click", function (e) {
                    onAdd(e, treeId, treeNode);
                    return false;
                });
        }
        function removeHoverDom(treeId, treeNode) {
            $("#addBtn_" + treeNode.id).unbind().remove();
        }

        function beforeRename(treeId, treeNode, newName) {
            var oldName = treeNode.name;
            if (newName.length == 0) {
                $.app.alert({
                    message : "节点名称不能为空。"
                });
                return false;
            }
            if(!confirm("确认重命名吗？")) {
                var zTree = $.fn.zTree.getZTreeObj(treeId);
                zTree.cancelEditName(treeNode.name);
                return false;
            }
            return true;
        }
        /**
         * 重命名结束
         * @param e
         * @param treeId
         * @param treeNode
         */
        function onRename(e, treeId, treeNode) {
            var url = config.renameUrl.replace("{id}", treeNode.id).replace("{newName}",treeNode.name);
            $.getJSON(url, function (data) {
                location.reload();
            });
        }
        /**
         * 重命名结束
         * @param e
         * @param treeId
         * @param treeNode
         */
        function onRemove(e, treeId, treeNode) {
            var url = config.removeUrl.replace("{id}", treeNode.id);
            $.getJSON(url, function (data) {
                location.reload();
            });
        }

        /**
         * 添加新节点
         * @param e
         * @param treeId
         * @param treeNode
         */
        function onAdd(e, treeId, treeNode) {
            var url = config.addUrl.replace("{id}", treeNode.id);
            $.getJSON(url, function(newNode) {
                location.reload();
            });
        }

        /**
         * 移动结束
         * @param event
         * @param treeId
         * @param treeNodes
         * @param targetNode
         * @param moveType
         * @param isCopy
         */
        function onDrop(event, treeId, treeNodes, targetNode, moveType, isCopy) {
            if(!targetNode || treeNodes.length == 0) {
                return;
            }
            var sourceId = treeNodes[0].id;
            var targetId = targetNode.id;
            var moveType = moveType;
            var url = config.moveUrl.replace("{sourceId}", sourceId).replace("{targetId}", targetId).replace("{moveType}", moveType);
            $.getJSON(url, function (newNode) {
                location.reload();
            });
        }

        var autocomplateEnable = config.autocomplete && config.autocomplete.enable;

        var id = this.index++;
        var treeStr = (autocomplateEnable ? this.autocompleteTemplate : '') + this.treeTemplate;
        $("body").append(treeStr.replace(/{id}/g, id));
        var zTree = $.fn.zTree.init($("#treeSelect" + id), setting, config.zNodes);

        if(autocomplateEnable) {
            config.autocomplete.input = $("#searchName" + id);
            config.autocomplete.async = config.autocomplete.async || config.async;
            config.autocomplete.callback = config.autocomplete.callback || $.noop();
            config.autocomplete.source = config.autocomplete.source || config.urlPrefix + "/ajax/autocomplete";
            $.zTree.initAutocomplete(config.autocomplete);
        }

        return zTree;

    },

    /**
     * @param nodeType 节点类型
     * @param zNodes 所有节点
     * @param idDomId 要保存的编号的dom id
     * @param nameDomId 要保存的名称的dom id
     * nodeType, zNodes, async, loadUrl, btn, idDomId, nameDomId, autocomplete, autocompleteUrl
     */
    initSelectTree : function(config) {
        config.asyncLoadAll = config.asyncLoadAll || false;
        config.loadUrl =
            config.loadUrl || (config.urlPrefix + "/ajax/load" +
                "?async=" + config.async +
                "&asyncLoadAll=" + config.asyncLoadAll +
                (config.excludeId ? "&excludeId=" + config.excludeId : ""));
        var autocomplateEnable = config.autocomplete && config.autocomplete.enable;

        var id = this.index++;
        var treeStr = (autocomplateEnable ? this.autocompleteTemplate : '') + this.treeTemplate;
        var treeContentStr = this.selectTreeTemplate.replace("{tree}", treeStr);
        $("body").append(treeContentStr.replace(/{id}/g, id));

        var $id = $("#" + config.select.id);
        var $name = $("#" + config.select.name);
        var treeContent = "treeContent" + id;
        var $treeContent = $("#" + treeContent);
        var treeSelect = "treeSelect" + id;

        var setting = {
            check: {
                enable: config.nodeType != "default",
                chkStyle: config.nodeType
            },
            async: {
                enable: config.async,
                url:config.loadUrl,
                autoParam:["id"],
                dataFilter: $.zTree.filter
            },
            view: {
                dblClickExpand: false
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            callback: {
                onClick: selectNode,
                onCheck: selectNode
            }
        };
        if(config.nodeType == "checkbox") {
            setting.check.chkboxType = {"Y":"", "N":""};
        } else if(config.nodeType == "radio") {
            setting.check.radioType = "level";
        }

        function fullName(node) {
            var names = node.name;

            while((node = node.getParentNode())) {
                if(node.root && !config.select.includeRoot) {
                    break;
                }
                names = node.name + " > " + names;
            }
            return names;
        }

        function selectNode(e, treeId, treeNode) {
            if(!setting.check.enable) {
                var nodes = zTree.getSelectedNodes();
                var lastNode = nodes[nodes.length - 1];
                $name.prop("value", fullName(lastNode));
                $id.prop("value", lastNode.id);
            } else {
                var nodes = zTree.getCheckedNodes(true);
                var names = "";
                var ids = "";
                for (var i = 0, l = nodes.length; i < l; i++) {
                    names += fullName(nodes[i]) + (i != l - 1 ? "," : "");
                    ids += nodes[i].id + (i != l - 1 ? "," : "");
                }

                $name.prop("value", names);
                $id.prop("value", ids);
            }
        }

        var show = false;
        function showMenu() {
            show = true;
            var nameOffset = $name.offset();
            $treeContent.css({left: nameOffset.left + "px", top: nameOffset.top + $name.outerHeight() + "px"}).slideDown("fast");

            $("body").bind("mousedown", onBodyDown);
        }

        function hideMenu() {
            show = false;
            $treeContent.fadeOut("fast");
            $("body").unbind("mousedown", onBodyDown);
        }

        function onBodyDown(event) {
            var isBtn = false;
            config.select.btn.each(function() {
                isBtn = isBtn ||
                        event.target == this ||
                        event.target.parentNode == this ||
                        (event.target.parentNode ? event.target.parentNode.parentNode : null) == this;
            });
            if (!(isBtn || $(event.target).closest(".ui-autocomplete").length > 0  || event.target.id == treeContent || $(event.target).closest("#" + treeContent).length > 0)) {
                hideMenu();
            }
        }

        config.select.btn.click(function () {
            if(show) {
                hideMenu();
            } else {
                showMenu();
            }
        });

        $("#" + treeSelect).data("treeNodeClick", function() {
            if(!setting.check.enable) {
                hideMenu();
            }
        });

        window.treeNodeClick = function(treeNode) {
            $(treeNode).closest(".ztree").data("treeNodeClick")();
        };
        var zTree = null;
        var initTree = function() {
            zTree = $.fn.zTree.init($("#" + treeSelect), setting, config.zNodes);

            if(autocomplateEnable) {
                config.autocomplete.input = $("#searchName" + id);
                config.autocomplete.async = config.autocomplete.async || config.async;
                config.autocomplete.callback = config.autocomplete.callback || function(searchName) { //按照名字搜索
                    var url = config.loadUrl + "&searchName=" + searchName;
                    zTree.destroy();
                    $.getJSON(url, function(zNodes) {
                        if(zNodes.length > 0) { //如果没找到节点就不必展示
                            zTree = $.fn.zTree.init($("#" + treeSelect), setting, zNodes);
                        }
                    });
                };
                config.autocomplete.source = config.autocomplete.source || config.urlPrefix + "/ajax/autocomplete";
                $.zTree.initAutocomplete(config.autocomplete);
            }
        };
        var initialize = false;
        if(config.lazy) {
            config.select.btn.click(function() {
                if(!initialize) {
                    initTree();
                    initialize = true;
                }
            });
        } else {
            initTree();
        }

    },
    initMaintainBtn : function(maintainUrlPrefix, id, async) {
        var updateUrl = maintainUrlPrefix + "/update/" + id,
            deleteUrl = maintainUrlPrefix + "/delete/" + id,
            appendChildUrl = maintainUrlPrefix + "/appendChild/" + id,
            moveTreeUrl = maintainUrlPrefix + "/move/" + id + "?async=" + async;


        $("#updateTree").click(function() {
            this.form.action = updateUrl;
        });
        $("#deleteTree").click(function () {
            var btn = this;
            $.app.confirm({
                width:500,
                message : "确认删除吗？",
                ok : function() {
                    btn.form.action = deleteUrl;
                    btn.form.submit();
                }
            });
            return false;
        });
        $("#appendChild").click(function () {
            window.location.href = appendChildUrl;
            return false;
        });
        $("#moveTree").click(function () {
            window.location.href = moveTreeUrl;
            return false;
        });

    },
    initMoveBtn : function() {
        $("#moveAsPrev").click(function() {
            $("#moveType").val("prev");
        });
        $("#moveAsNext").click(function() {
            $("#moveType").val("next");
        });
        $("#moveAsInner").click(function() {
            $("#moveType").val("inner");
        });

    }
    ,
    split : function( val ) {
    return val.split( /,\s*/ );
    },
    extractLast : function( term ) {
        return this.split( term ).pop();
    }
    ,
    initAutocomplete : function(config) {
        var input = config.input;
        $(input)
            .on( "keydown", function( event ) {
                //回车查询
                if(event.keyCode === $.ui.keyCode.ENTER) {
                    config.callback(input.val());
                }
            })
            .autocomplete({
                source: config.source,
                minLength:1,
                select: function() {config.callback(input.val());}
            });
    },
    filter : function(treeId, parentNode, childNodes) {
        if (!childNodes) return null;
        for (var i=0, l=childNodes.length; i<l; i++) {
            childNodes[i].name = childNodes[i].name.replace(/\.n/g, '.');
        }
        return childNodes;
    }

}