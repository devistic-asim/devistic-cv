import { describe, expect, it } from 'vitest'
import { formatIso, formatRange, parseLooseDate } from './dates'

describe('parseLooseDate', () => {
  it('reads month names, numeric months, and years', () => {
    expect(parseLooseDate('Jan 2020')).toEqual({ iso: '2020-01', precision: 'month' })
    expect(parseLooseDate('September 2019')).toEqual({ iso: '2019-09', precision: 'month' })
    expect(parseLooseDate('01/2020')).toEqual({ iso: '2020-01', precision: 'month' })
    expect(parseLooseDate('2020-03-02')).toEqual({ iso: '2020-03', precision: 'month' })
    expect(parseLooseDate('2020/03')).toEqual({ iso: '2020-03', precision: 'month' })
    expect(parseLooseDate('2018')).toEqual({ iso: '2018', precision: 'year' })
    expect(parseLooseDate('Present').iso).toBe('')
  })
})

describe('formatRange', () => {
  it('formats a current role and a closed role', () => {
    expect(formatRange('2021-01', '', true, 'MMM yyyy')).toBe('Jan 2021 – Present')
    expect(formatRange('2018', '2020', false, 'yyyy-MM')).toBe('2018 – 2020')
    expect(formatIso('2022-04', 'MM/yyyy')).toBe('04/2022')
    expect(formatIso('2022-04', 'MMMM yyyy')).toBe('April 2022')
  })
})
