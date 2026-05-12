/** 按钮 / 区块级权限码（与后端约定字符串即可） */
export const PERM_WILDCARD = '*'

/** Nest 后端 system:* 权限（与若依风格一致） */
export const PERM_SYSTEM_USER_LIST = 'system:user:list'
export const PERM_SYSTEM_USER_ADD = 'system:user:add'
export const PERM_SYSTEM_USER_EDIT = 'system:user:edit'
export const PERM_SYSTEM_USER_REMOVE = 'system:user:remove'
export const PERM_SYSTEM_USER_RESET = 'system:user:resetPwd'

export const PERM_SYSTEM_ROLE_LIST = 'system:role:list'
export const PERM_SYSTEM_ROLE_ADD = 'system:role:add'
export const PERM_SYSTEM_ROLE_EDIT = 'system:role:edit'
export const PERM_SYSTEM_ROLE_REMOVE = 'system:role:remove'

export const PERM_SYSTEM_MENU_LIST = 'system:menu:list'
export const PERM_SYSTEM_MENU_ADD = 'system:menu:add'
export const PERM_SYSTEM_MENU_EDIT = 'system:menu:edit'
export const PERM_SYSTEM_MENU_REMOVE = 'system:menu:remove'

export const PERM_SYSTEM_DEPT_LIST = 'system:dept:list'
export const PERM_SYSTEM_DEPT_ADD = 'system:dept:add'
export const PERM_SYSTEM_DEPT_EDIT = 'system:dept:edit'
export const PERM_SYSTEM_DEPT_REMOVE = 'system:dept:remove'

export const PERM_SYSTEM_POST_LIST = 'system:post:list'
export const PERM_SYSTEM_POST_ADD = 'system:post:add'
export const PERM_SYSTEM_POST_EDIT = 'system:post:edit'
export const PERM_SYSTEM_POST_REMOVE = 'system:post:remove'

export const PERM_SYSTEM_DICT_LIST = 'system:dict:list'
export const PERM_SYSTEM_DICT_ADD = 'system:dict:add'
export const PERM_SYSTEM_DICT_EDIT = 'system:dict:edit'
export const PERM_SYSTEM_DICT_REMOVE = 'system:dict:remove'

export const PERM_SYSTEM_ACCOUNT_LIST = 'system:account:list'
export const PERM_SYSTEM_ACCOUNT_ADD = 'system:account:add'
export const PERM_SYSTEM_ACCOUNT_EDIT = 'system:account:edit'

export const PERM_CONTENT_ARTICLE_CREATE = 'content:article:create'
export const PERM_CONTENT_ARTICLE_EXPORT = 'content:article:export'
export const PERM_CONTENT_ARTICLE_EDIT = 'content:article:edit'

/** @deprecated 使用 PERM_SYSTEM_USER_ADD */
export const PERM_SYSTEM_USER_CREATE = PERM_SYSTEM_USER_ADD

export const PERM_SYSTEM_LOG_EXPORT = 'system:log:export'
export const PERM_SYSTEM_LOG_CLEAR = 'system:log:clear'

export const PERM_MONITOR_OPERLOG_QUERY = 'monitor:operlog:query'
export const PERM_MONITOR_OPERLOG_REMOVE = 'monitor:operlog:remove'
export const PERM_MONITOR_OPERLOG_EXPORT = 'monitor:operlog:export'

export const PERM_MONITOR_LOGININFOR_REMOVE = 'monitor:logininfor:remove'
export const PERM_MONITOR_LOGININFOR_UNLOCK = 'monitor:logininfor:unlock'
export const PERM_MONITOR_LOGININFOR_EXPORT = 'monitor:logininfor:export'

export const PERM_TOOL_MYSQL_ADD = 'tool:mysql:add'
export const PERM_TOOL_MYSQL_EDIT = 'tool:mysql:edit'
export const PERM_TOOL_MYSQL_REMOVE = 'tool:mysql:remove'

export const PERM_TOOL_QUERY_CONNECT = 'tool:query:connect'
export const PERM_TOOL_QUERY_EXECUTE = 'tool:query:execute'

export const PERM_TOOL_EXE_ADD = 'tool:exe:add'
export const PERM_TOOL_EXE_EDIT = 'tool:exe:edit'
export const PERM_TOOL_EXE_REMOVE = 'tool:exe:remove'
export const PERM_TOOL_EXE_MONITOR_START = 'tool:exe:monitor:start'
export const PERM_TOOL_EXE_MONITOR_STOP = 'tool:exe:monitor:stop'
export const PERM_TOOL_EXE_RESTART_START = 'tool:exe:restart:start'
export const PERM_TOOL_EXE_RESTART_STOP = 'tool:exe:restart:stop'

export const PERM_TOOL_EXE_LOG_QUERY = 'tool:exeLog:query'
export const PERM_TOOL_EXE_LOG_CLEAR = 'tool:exeLog:clear'

/** 打印机管理（与 Nest `Print:Machile:*` 保持一致，后端拼写为 Machile） */
export const PERM_PRINT_MACHINE_ADD = 'Print:Machile:add'
export const PERM_PRINT_MACHINE_REMOVE = 'Print:Machile:remove'
export const PERM_PRINT_MACHINE_SERVER = 'Print:Machile:server'

export const PERM_PRICE_TEMPLATE_ADD = 'Price:Template:add'
export const PERM_PRICE_TEMPLATE_EDIT = 'Price:Template:edit'
export const PERM_PRICE_TEMPLATE_REMOVE = 'Price:Template:remove'

export const PERM_DEMO_TABLE_EXPORT = 'demo:table:export'
export const PERM_DEMO_ROW_EDIT = 'demo:row:edit'
export const PERM_DEMO_ROW_TOGGLE = 'demo:row:toggle'

/** 示例子应用「按钮权限」页专用（演示预设仅含部分，便于对比效果） */
export const PERM_DEMO_PERM_VISIBLE = 'demo:perm:visible'
export const PERM_DEMO_PERM_HIDDEN = 'demo:perm:hidden'
export const PERM_DEMO_PERM_DISABLED = 'demo:perm:disabled'
export const PERM_DEMO_PERM_ALL_A = 'demo:perm:allA'
export const PERM_DEMO_PERM_ALL_B = 'demo:perm:allB'

/** 纯展示类：无该权限则整块不渲染 */
export const PERM_DASHBOARD_SENSITIVE = 'dashboard:sensitive'
