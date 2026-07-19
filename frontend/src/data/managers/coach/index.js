// UEFA
import aut from './aut';
import bel from './bel';
import bih from './bih';
import cro from './cro';
import cze from './cze';
import eng from './eng';
import fra from './fra';
import ger from './ger';
import ned from './ned';
import nor from './nor';
import por from './por';
import sco from './sco';
import esp from './esp';
import swe from './swe';
import sui from './sui';
import tur from './tur';

// CAF
import alg from './alg';
import cpv from './cpv';
import cod from './cod';
import egy from './egy';
import gha from './gha';
import civ from './civ';
import mar from './mar';
import sen from './sen';
import rsa from './rsa';
import tun from './tun';

// AFC
import aus from './aus';
import irn from './irn';
import irq from './irq';
import jpn from './jpn';
import jor from './jor';
import kor from './kor';
import qat from './qat';
import ksa from './ksa';
import uzb from './uzb';

// CONMEBOL
import arg from './arg';
import bra from './bra';
import col from './col';
import ecu from './ecu';
import par from './par';
import uru from './uru';

// CONCACAF
import can from './can';
import mex from './mex';
import usa from './usa';
import cuw from './cuw';
import hai from './hai';
import pan from './pan';

// OFC
import nzl from './nzl';

// 국가 코드 → 감독 이름. 새 국가를 추가하려면 이 폴더에 파일을 만들고 여기서 이어붙인다.
export const MANAGERS = {
  // UEFA
  aut, bel, bih, cro, cze, eng, fra, ger, ned, nor, por, sco, esp, swe, sui, tur,
  // CAF
  alg, cpv, cod, egy, gha, civ, mar, sen, rsa, tun,
  // AFC
  aus, irn, irq, jpn, jor, kor, qat, ksa, uzb,
  // CONMEBOL
  arg, bra, col, ecu, par, uru,
  // CONCACAF
  can, mex, usa, cuw, hai, pan,
  // OFC
  nzl,
};
