import { BuildParam, Popup } from './popup';

function buildPopup(buildParam: BuildParam): Popup {
  const root = document.createElement('div');
  root.className = 'ilhpp-popup-mobile';
  return {
    elem: root,
    anchor: buildParam.anchor,
    oldTitle: buildParam.title,
  };
}

async function detachPopup(popup: Popup) {

}

export { buildPopup, detachPopup };
