<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@include file="/WEB-INF/jsp/common/taglibs.jspf"%>
<es:contentHeader/>
<div class="panel">


    <ul class="nav nav-tabs">
        <c:if test="${op eq '新增'}">
            <li <c:if test="${op eq '新增'}">class="active"</c:if>>
                <a href="${ctx}/showcase/editor/create?BackURL=<es:BackURL/>">
                    <i class="icon-file"></i>
                    新增
                </a>
            </li>
        </c:if>

        <c:if test="${not empty m.id}">
            <li <c:if test="${op eq '查看'}">class="active"</c:if>>
                <a href="${ctx}/showcase/editor/${m.id}?BackURL=<es:BackURL/>">
                    <i class="icon-eye-open"></i>
                    查看
                </a>
            </li>
            <li <c:if test="${op eq '修改'}">class="active"</c:if>>
                <a href="${ctx}/showcase/editor/update/${m.id}?BackURL=<es:BackURL/>">
                    <i class="icon-edit"></i>
                    修改
                </a>
            </li>
            <li <c:if test="${op eq '删除'}">class="active"</c:if>>
                <a href="${ctx}/showcase/editor//delete/${m.id}?BackURL=<es:BackURL/>">
                    <i class="icon-trash"></i>
                    删除
                </a>
            </li>
        </c:if>
        <li>
            <a href="<es:BackURL/>" class="btn btn-link">
                <i class="icon-reply"></i>
                返回
            </a>
        </li>
    </ul>


    <form:form id="editForm" method="post" commandName="m" cssClass="form-horizontal">

            <es:showGlobalError commandName="m"/>

            <form:hidden path="id"/>


            <div class="control-group">
                <form:label path="title" cssClass="control-label">标题</form:label>
                <div class="controls">
                    <form:input path="title" cssClass="input-xxlarge validate[required,minSize[2],maxSize[200]]"/>
                </div>
            </div>


            <div class="control-group">
                <form:label path="content" cssClass="control-label">内容</form:label>
                <div class="controls">
                    <c:choose>
                    <c:when test="${op ne '查看'}">
                        <form:textarea path="content" cssClass="validate[required]" cssStyle="width: 600px;height: 300px;"/>
                    </c:when>
                    <c:otherwise>
                        ${m.content}
                    </c:otherwise>
                    </c:choose>

               </div>
            </div>


            <c:if test="${op eq '新增'}">
                <c:set var="icon" value="icon-file"/>
            </c:if>
            <c:if test="${op eq '修改'}">
                <c:set var="icon" value="icon-edit"/>
            </c:if>
            <c:if test="${op eq '删除'}">
                <c:set var="icon" value="icon-trash"/>
            </c:if>

            <div class="control-group">
                <div class="controls">
                    <button type="submit" class="btn btn-primary">
                        <i class="${icon}"></i>
                            ${op}
                    </button>
                    <a href="<es:BackURL/>" class="btn">
                        <i class="icon-reply"></i>
                        返回
                    </a>
                </div>
            </div>


    </form:form>
</div>
<es:contentFooter/>
<%@include file="/WEB-INF/jsp/common/import-editor-js.jspf"%>
<script type="text/javascript">
    $(function () {
        <c:choose>
            <c:when test="${op eq '删除'}">
                //删除时不验证 并把表单readonly
                $.app.readonlyForm($("#editForm"), false);
            </c:when>
            <c:when test="${op eq '查看'}">
                $.app.readonlyForm($("#editForm"), true);
            </c:when>
            <c:otherwise>
                var validationEngine = $("#editForm").validationEngine();
                <es:showFieldError commandName="m"/>
            </c:otherwise>
        </c:choose>

        var editor = KindEditor.create('textarea[name="content"]', {
            themeType: 'simple',
            uploadJson: '${ctx}/kindeditor/upload',
            fileManagerJson: '${ctx}/kindeditor/filemanager',
            allowFileManager: true,
            afterCreate: function () {
                var self = this;
                KindEditor.ctrl(document, 13, function () {
                    self.sync();
                    $("#editForm").submit();
                });
                KindEditor.ctrl(self.edit.doc, 13, function () {
                    self.sync();
                    $("#editForm").submit();
                });
            }
        });
    });
</script>