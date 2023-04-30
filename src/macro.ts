// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { addNamed } from '@babel/helper-module-imports'
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { createMacro } from 'babel-plugin-macros'

const macro = ({ references }: { references: { useProxy?: NodePath[] } }) => {
  if (import.meta.env?.MODE !== 'production') {
    throw new Error(`[DEPRECATED] Use useProxy hook instead.`)
  }
  references.useProxy?.forEach((path) => {
    const hook = addNamed(path, 'useSnapshot', 'valtio')
    const proxy = (path.parentPath?.get('arguments.0') as any)?.node
    if (!t.isIdentifier(proxy)) throw new Error('no proxy object')
    const snap = t.identifier(`valtio_macro_snap_${proxy.name}`)
    path.parentPath?.parentPath?.replaceWith(
      t.variableDeclaration('const', [
        t.variableDeclarator(snap, t.callExpression(hook, [proxy])),
      ])
    )
    let inFunction = 0
    path.parentPath?.getFunctionParent()?.traverse({
      Identifier(p) {
        if (inFunction === 0 && p.node !== proxy && p.node.name === proxy.name) {
          p.node.name = snap.name
        }
      },
      Function: {
        enter() { inFunction++ },
        exit() { inFunction-- },
      },
    })
  })
}

export default createMacro(macro, { configName: 'valtio' })
