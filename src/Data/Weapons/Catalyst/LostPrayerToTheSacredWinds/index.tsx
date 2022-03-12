import type { WeaponData } from 'pipeline'
import { input } from '../../../../Formula'
import { lookup, naught, percent, prod, subscript } from "../../../../Formula/utils"
import { allElements, WeaponKey } from '../../../../Types/consts'
import { objectKeyMap, range } from '../../../../Util/Util'
import { cond, trans, st } from '../../../SheetUtil'
import { dataObjForWeaponSheet } from '../../util'
import WeaponSheet, { conditionaldesc, conditionalHeader, IWeaponSheet } from '../../WeaponSheet'
import iconAwaken from './AwakenIcon.png'
import data_gen_json from './data_gen.json'
import icon from './Icon.png'

const key: WeaponKey = "LostPrayerToTheSacredWinds"
const [tr, trm] = trans("weapon", key)
const data_gen = data_gen_json as WeaponData
const ele_dmg_s = [0.12, 0.15, 0.18, 0.21, 0.24]

const [condPassivePath, condPassive] = cond(key, "BoundlessBlessing")

const moveSPD_ = percent(0.1)
const eleDmgInc = subscript(input.weapon.refineIndex, ele_dmg_s)
const eleDmgStacks = Object.fromEntries(allElements.map(ele => [ele, lookup(condPassive, {
  ...objectKeyMap(range(1, 4), i => prod(eleDmgInc, i)),
}, naught)]))

export const data = dataObjForWeaponSheet(key, data_gen, {
  premod: {
    moveSPD_,
    ...Object.fromEntries(allElements.map(ele => [`${ele}_dmg_`, eleDmgStacks[ele]])),
  },
})
const sheet: IWeaponSheet = {
  icon,
  iconAwaken,
  document: [{
    fields: [{ node: moveSPD_ }],
    conditional: {
      value: condPassive,
      path: condPassivePath,
      header: conditionalHeader(tr, icon, iconAwaken),
      description: conditionaldesc(tr),
      name: trm("condName"),
      states: {
        ...objectKeyMap(range(1, 4), i => ({
          name: st("stack", { count: i }),
          fields: [
            ...allElements.map(ele => ({ node: eleDmgStacks[ele] }))
          ]
        }))
      }
    }
  }],
}
export default new WeaponSheet(key, sheet, data_gen, data)
