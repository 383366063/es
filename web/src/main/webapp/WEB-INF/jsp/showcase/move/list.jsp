<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@include file="/WEB-INF/jsp/common/taglibs.jspf"%>
<es:contentHeader/>

<div data-table="table" class="panel">
    <ul class="nav nav-tabs">
        <li <c:if test="${empty param['search.show_eq']}">class="active"</c:if>>
            <a href="${ctx}/showcase/move">
                <i class="icon-table"></i>
                所有数据列表
            </a>
        </li>
        <li <c:if test="${param['search.show_eq'] eq 'true'}">class="active"</c:if>>
            <a href="${ctx}/showcase/move?search.show_eq=true">
                <i class="icon-table"></i>
                可显示的数据列表
            </a>
        </li>
        <li <c:if test="${param['search.show_eq'] eq 'false'}">class="active"</c:if>>
            <a href="${ctx}/showcase/move?search.show_eq=false">
                <i class="icon-table"></i>
                隐藏的数据列表
            </a>
        </li>
    </ul>

    <es:showMessage/>
    <div class="row-fluid tool ui-toolbar">
        <div class="span4">
            <div class="btn-group">
                <a id="create" class="btn " href="${ctx}/showcase/move/create">
                    <span class="icon-file"></span>
                    新增
                </a>
                <a class="btn btn-update">
                    <span class="icon-edit"></span>
                    修改
                </a>
                <a class="btn btn-batch-delete">
                    <span class="icon-trash"></span>
                    批量删除
                </a>
                <a id="reweight" class="btn">
                    <span class="icon-cog"></span>
                    优化权重
                </a>
            </div>
        </div>
        <div class="span8">
            <%@include file="searchForm.jsp"%>
        </div>
    </div>
    <%@include file="listTable.jsp"%>
</div>
<es:contentFooter/>

<script type="text/javascript">
    $(function() {
        $.movable.initMovableReweight($("#reweight"), "${ctx}/showcase/move/reweight");
    });
</script>
