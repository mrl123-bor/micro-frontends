/** 与 drag 设计器一致，供列表缩略图与画布共用 */

export function buildDefaultTableCell(
  col: Record<string, unknown> | undefined,
  value: unknown = '',
) {
  return {
    value: String(value ?? ''),
    colspan: 1,
    rowspan: 1,
    fontSize: (col?.fontSize as number) || 12,
    fontColor: (col?.fontColor as string) || '#303133',
    horizontalAlign: (col?.horizontalAlign as string) || 'center',
    verticalAlign: (col?.verticalAlign as string) || 'middle',
    font: (col?.font as string) || 'Microsoft YaHei',
    fontWeight: (col?.fontWeight as string) || 'normal',
    wrap: col?.wrap !== false,
    autoFit: !!col?.autoFit,
    keys: (col?.keys as string) || '',
  }
}

export function normalizeTableData(datas: unknown) {
  if (!datas || typeof datas !== 'object') {
    return {
      title: [] as Record<string, unknown>[],
      label: [] as Record<string, unknown>[][],
      rowHeights: [] as number[],
      titleBols: false,
      labelBols: false,
      hasHeader: true,
      dataSource: 'local',
      dataVariable: '',
      dataFieldMapping: {} as Record<string, unknown>,
      emptyDataPlaceholder: '',
    }
  }

  const d = datas as Record<string, unknown>

  const normalizedTitle = (Array.isArray(d.title) ? d.title : []).map((col: Record<string, unknown>, idx: number) => ({
    label: col?.label ?? `列${idx + 1}`,
    width: Number(col?.width || 100),
    height: Number(col?.height || 50),
    fontSize: Number(col?.fontSize || 12),
    fontColor: col?.fontColor || '#303133',
    horizontalAlign: col?.horizontalAlign || 'center',
    verticalAlign: col?.verticalAlign || 'middle',
    font: col?.font || 'Microsoft YaHei',
    fontWeight: col?.fontWeight || 'normal',
    wrap: col?.wrap !== false,
    autoFit: !!col?.autoFit,
    colspan: col?.colspan == null ? 1 : Number(col.colspan),
    rowspan: col?.rowspan == null ? 1 : Number(col.rowspan),
    keys: col?.keys || `col_${idx}`,
    variable: col?.variable || '',
  }))

  const rawRows = Array.isArray(d.label) ? d.label : []
  const normalizedRows = rawRows.map((row: unknown) => {
    if (Array.isArray(row)) {
      return normalizedTitle.map((col, colIndex) => {
        const cell = row[colIndex] as Record<string, unknown> | undefined
        if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
          return {
            ...buildDefaultTableCell(col, cell.value),
            ...cell,
            value: String(cell.value ?? ''),
            colspan: cell.colspan == null ? 1 : Number(cell.colspan),
            rowspan: cell.rowspan == null ? 1 : Number(cell.rowspan),
          }
        }
        return buildDefaultTableCell(col, cell)
      })
    }
    if (row && typeof row === 'object') {
      const obj = row as Record<string, unknown>
      return normalizedTitle.map((col) => buildDefaultTableCell(col, obj[col.keys as string]))
    }
    return normalizedTitle.map((col) => buildDefaultTableCell(col, ''))
  })

  const defaultHeight = Number(normalizedTitle[0]?.height || 50)
  const rowHeights = Array.isArray(d.rowHeights)
    ? normalizedRows.map((_, idx) => Number((d.rowHeights as number[])[idx] || defaultHeight))
    : normalizedRows.map(() => defaultHeight)

  return {
    ...d,
    title: normalizedTitle,
    label: normalizedRows,
    rowHeights,
    titleBols: !!d.titleBols,
    labelBols: !!d.labelBols,
    hasHeader: d.hasHeader !== false,
    dataSource: d.dataSource || 'local',
    dataVariable: d.dataVariable || '',
    dataFieldMapping: d.dataFieldMapping || {},
    emptyDataPlaceholder: d.emptyDataPlaceholder || '',
  }
}
