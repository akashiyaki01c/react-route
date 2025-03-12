/**
 * latlonxy.js
 * 日本における世界測地系(=日本測地系2011)での、緯度経度と平面直角座標(XY)の双方向変換を行うJavaScript。
 * 以下の計算式に基づいて作成している。
 * Gauss-Kruger 投影における経緯度座標及び平面直角座標相互間の座標換算に
 * ついてのより簡明な計算方法: 2011 河瀬和重 (国土地理院時報，121，109?124．)
 * https://www.gsi.go.jp/common/000061216.pdf
 * 本プログラムは無保証であり、自己責任で使用すること。
 * author: Yuhichi Ishikawa (TonbiWing)
 */
/** 
 * 緯度経度から平面直角座標XYに変換し、真北方向角、縮尺係数と共に、4要素の配列を返す。
 * zone関数またはzoneJapan関数で作成した座標系情報(zone)を指定する必要がある。
 * 結果のx,yは地理学、測量、航海術の標準にしたがってxが南北(x>0が北、x<0が南)、yが東西(y>0が東,y<0が西)。
 * @param {number} latDegree 変換対象の緯度(度) (?=latitude)
 * @param {number} lonDegree 変換対象の経度(度) (λ=longitude)
 * @param {number} zone 座標系情報 [緯度, 経度, 定数S, 定数A]の配列。
 * @return {number[]} [X座標(m単位), Y座標(m単位), 真北方向角、縮尺係数]の4要素の変数
 */
export function latlon2xy(latDegree: number, lonDegree: number, zone: number[]): [number, number, number, number] {
	const originLat = zone[0]; //原点緯度(度)
	const originLon = zone[1]; //原点経度(度)
	const sOverline = zone[2]; //定数S
	const aOverline = zone[3]; //定数A
	function toRadian(degree: number) {
		return degree * Math.PI / 180;
	}

	function toDegree(radian: number) {
		return radian * 180.0 / Math.PI;
	}
	const coefN = 0.0016792203946287445; // N : 1/ (2F-1)
	const coef0 = 0.08181919104281579; // = 2√n/(1+n)
	const longerRadius = 6378137.0; //
	/** α(i) (i=1...,5) : 経度緯度から平面直角座標の変換(latlon2xy)に使う定数 */
	const alpha = [0.0, 8.377318247285465E-4, 7.608527848379248E-7,
		1.1976455002315586E-9, 2.4291502606542468E-12, 5.750164384091974E-15
	];
	const lat = toRadian(latDegree);
	const lon = toRadian(lonDegree);
	const diffLon = lon - toRadian(originLon); //λ-λ0 　経度と原点の経度の差分
	const cosDiffLon = Math.cos(diffLon); //λc　= cos( λ - λ0) )
	const sinDiffLon = Math.sin(diffLon); //λs  = sin( λ - λ0) )  
	//t = sinh( atanh(sin((?)　- 2√n/(1+n) * atanh(2√n/(1+n)*sin(?))  )　
	const t = Math.sinh(Math.atanh(Math.sin(lat)) - coef0 * Math.atanh(coef0 * Math.sin(lat)));
	const t_overline = Math.sqrt(1.0 + t * t); //t上線付 
	const xiDash = Math.atan(t / cosDiffLon); // ξ'
	const etaDash = Math.atanh(sinDiffLon / t_overline); // η'
	//平面直角座標XとYを計算するための行列式determinant	
	let determX = 0;
	let determY = 0;
	// tOverline, sigma, tauは子午線収差角γ (= -真北方向角) と 縮尺係数mのための変数
	const tOverline = Math.sqrt(1 + t * t); //t上線付 = √(1+t＾2)
	let sigma = 0; //σ (sigma) = 1 + Σ{j=1..5} 2jα(j) * cos(2jξ') * cosh(2j η')
	let tau = 0; //τ (tau) =  Σ{j=1..5} 2jα(j) * cos(2jξ') * cosh(2j η')
	for (let j = 1; j <= 5; j++) {
		let j2xiDash = 2 * j * xiDash; //2j ξ'		
		let j2etaDash = 2 * j * etaDash; //// 2j η'
		determX += alpha[j] * Math.sin(j2xiDash) * Math.cosh(j2etaDash);
		determY += alpha[j] * Math.cos(j2xiDash) * Math.sinh(j2etaDash);
		let j2Alpha = 2 * j * alpha[j]; // 2jα(j)
		//σ (sigma) = 1 + Σ{j=1..5}( 2jα(j) * cos(2jξ') * cosh(2j η')
		sigma += j2Alpha * Math.cos(j2xiDash) * Math.cosh(j2etaDash);
		//τ (tau) =  Σ{j=1..5}( 2jα(j) * cos(2jξ') * cosh(2j η')
		tau += j2Alpha * Math.sin(j2xiDash) * Math.sinh(j2etaDash);
	}
	sigma = sigma + 1;
	let result = [0, 0, 0, 0] as [number, number, number, number]; // [x,y,真北方向角,縮尺係数]
	result[0] = aOverline * (xiDash + determX) - sOverline; //x
	result[1] = aOverline * (etaDash + determY); //y
	//γ (gamma 子午線収差角= -真北方向角)
	const gamma = Math.tanh(((tau * tOverline * cosDiffLon) + (sigma * t * sinDiffLon)) / ((sigma * tOverline * cosDiffLon) - (tau * t * sinDiffLon)));
	const coefM = (1 - coefN) / (1 + coefN) * Math.tan(lat); //m (scaleFactor)
	// m  (scaleFactor) = sOverline / a * √(σ^2 + τ^2)(t^2 + λx^2) {1+(1-n)/(1+n)*tan?)}^2 
	const scaleFactor = aOverline / longerRadius * Math.sqrt((sigma * sigma + tau * tau) / (t * t + cosDiffLon * cosDiffLon) * (1 + coefM * coefM));
	result[2] = toDegree(-gamma); //-γ (-gamma = 真北方向角)
	result[3] = scaleFactor; // m 縮尺係数
	return result;
}
/** 
 * 平面直角座標XYから緯度経度へ、系番号を指定して変換する。
 * 地理学、測量、航海術の標準にしたがってxが南北(x>0が北、x<0が南)、yが東西(y>0が東,y<0が西)。
 * zone関数またはzoneJapan関数で作成した座標系情報(zone)を指定する必要がある。
 * @param {number} x 変換対象のX座標 (原点からの南北の距離 (m単位))
 * @param {number} y 変換対象のY座標 (原点からの東西の距離 (m単位))
 * @param {number} zone 座標系情報 [緯度, 経度, 定数S, 定数A]の配列。
 * @return {number[]} 経度緯度(度単位)を示す1次元配列[緯度,経度]。
 */
export function xy2latlon(x: number, y: number, zone: number[]): [number, number] {
	const originLat = zone[0]; //原点緯度(度)
	const originLon = zone[1]; //原点経度(度)
	const sOverline = zone[2]; //定数S
	const aOverline = zone[3]; //定数A
	function toRadian(degree: number) {
		return degree * Math.PI / 180;
	}

	function toDegree(radian: number) {
		return radian * 180.0 / Math.PI;
	}
	/** β(i)　(i=1,2,...5) */
	const beta = [0.0, 8.377321681620316E-4, 5.905870211016955E-8, 1.6734826761541112E-10, 2.1648237311010893E-13, 3.79409187887551E-16];
	/** δ(i) (i=1,2,...6) */
	const delta = [0.0, 0.003356551485604312, 6.571873263127177E-6, 1.7646404372866207E-8, 5.3877538900094696E-11, 1.7640075159133883E-13, 6.056074055207582E-16];
	const xi = (x + sOverline) / aOverline; // ξ
	const eta = y / aOverline; // η
	// ξ'(xiDash)と η'(etaDash)を計算するための行列式determinant
	let determXi = 0;
	let determEta = 0;
	for (let j = 1; j <= 5; j++) {
		//Σ{j=1..5}( βj * sin(2jξ)cosh(2jη) )
		determXi += beta[j] * Math.sin(2.0 * j * xi) * Math.cosh(2 * j * eta);
		//Σ(j=1..5){ βjcos(2jξ)sinh(2jη) }
		determEta += beta[j] * Math.cos(2.0 * j * xi) * Math.sinh(2 * j * eta);
	}
	const xiDash = xi - determXi; // ξ' 
	const etaDash = eta - determEta; // η'
	const chi = Math.asin(Math.sin(xiDash) / Math.cosh(etaDash)); // χ= asin( sin ξ' / cosh η') 
	let sigmaLat = 0;
	for (let j = 1; j <= 6; j++) {
		sigmaLat += delta[j] * Math.sin(2.0 * j * chi); //Σ{j=1..5}( δjsin(2jχ) )
	}
	let latlon = [0, 0] as [number, number];
	///緯度(radian単位)  ? = χ+ sigmaLat
	let latInRadian = chi + sigmaLat;
	latlon[0] = toDegree(latInRadian);
	//経度(radian単位) λ = λ0+tan?1(sinh(η′)/cos(ξ′))
	let lonInRadian = toRadian(originLon) + (Math.atan(Math.sinh(etaDash) / Math.cos(xiDash)));
	latlon[1] = toDegree(lonInRadian);
	return latlon;
}
/**
 * 任意の原点の経度緯度を指定して、平面直角座標系情報の配列(原点緯度、原点経度、定数S、 定数A)返す
 * @param {number} orgLat 原点の緯度
 * @param {number} orgLon 原点の経度
 * @return {number[]} 座標系情報 [緯度, 経度, 定数S, 定数A]の4要素の配列
 */
export function xyzone(orgLat: number, orgLon: number): [number, number, number, number] {
	function toRadian(degree: number) {
		return degree * Math.PI / 180;
	}
	const orgLatRadian = toRadian(orgLat); // 経度をRadianに変換する 
	const scaleFm0 = 0.9999; // mo : 原点における縮尺係数
	const longerRadius = 6378137.0; //a: GRS80楕円体の長半径。
	const coefN = 0.0016792203946287445; // N : 1/ (2-楕円扁平率の逆数)
	const coef0 = 0.08181919104281579; //coef0 = 2√n/(1+n)
	/** A(i) (i=0,1...,5) : 経度緯度から平面直角座標と、その逆変換の両方に使う定数 */
	const largeA = [1.0000007049454078, -0.0025188297041239312, 2.6435429493240994E-6, -3.4526259073074147E-9, 4.891830424387949E-12, -7.228726045813916E-15];
	//定数sOverLIneのための行列式 Σ(j=1..5)(Aj*sin(2*j*?0) 
	let determS = 0;
	for (let j = 1; j <= 5; j++) {
		determS += largeA[j] * Math.sin(2.0 * j * orgLatRadian);
	}
	// (m0*a)/(1+n)
	const originCoef = (scaleFm0 * longerRadius) / (1.0 + coefN);
	// Sの上線付(?0) = (m0*a)/(1+n) * ( A0 * ?0 + Σ(j=1..5)(Aj*sin(2*j*?0) ) 
	const sOverline = originCoef * (largeA[0] * orgLatRadian + determS);
	// Aの上線付  = (m0*a)/(1+n) * A0
	const aOverline = originCoef * largeA[0];
	const result = [orgLat, orgLon, sOverline, aOverline] as [number, number, number, number];
	return result;
	}
/**
 * 日本の平面直角座標系1～19の系番号を指定して座標系情報の配列 [緯度, 経度, 定数S, 定数A] を取得する。
 * 日本の系1～19の原点に対応した内部定数値を、事前計算済みの定数S,定数Aを取得することで、
 * 逆三角関数、双曲線関数などの計算を省略し、実行を軽量化する。
 * @param {number} sysno 系番号(1～19)
 * @return {number[]} [緯度, 経度, 定数S, 定数A]の4要素の配列
 */
export function xyzonejapan(sysno: number): number[] {
	const origins = [
		[0.0, 0.0], // 添字0は使用しない
		[33.0, 129.5], // 座標系1: 長崎県 鹿児島県の後間、岩礁
		[33.0, 131.0], // 座標系2: 福岡県　佐賀県　熊本県　大分県　宮崎県　鹿児島県（1系区域以外)
		[36.0, 132.16666666666667], // 座標系3:山口県　島根県　広島県
		[33.0, 133.5], // 座標系4: 香川県　愛媛県　徳島県　高知県
		[36.0, 134.33333333333333], // 座標系5: 兵庫県　鳥取県　岡山県
		[36.0, 136.0], // 座標系6: 京都府　大阪府　福井県　滋賀県　三重県　奈良県 和歌山県
		[36.0, 137.16666666666667], // 座標系7: 石川県　富山県　岐阜県　愛知県
		[36.0, 138.5], // 座標系8: 新潟県　長野県　山梨県　静岡県
		[36.0, 139.83333333333333], // 座標系9: 東京都（14,18,19系以外)　福島県　栃木県　茨城県　埼玉県 千葉県　群馬県　神奈川県
		[40.0, 140.83333333333333], // 座標系10: 青森県　秋田県　山形県　岩手県　宮城県
		[44.0, 140.25], // 座標系11: 小樽市　函館市　伊達市　北斗市　北海道後志総合振興局の所管区域　豊浦町　壮瞥町　洞爺湖町
		//          北海道渡島総合振興局の所管区域　北海道檜山振興局の所管区域
		[44.0, 142.25], // 座標系12: 北海道（11,13系以外)
		[44.0, 144.25], // 座標系13: 北見市　帯広市　釧路市　網走市　根室市　美幌町、津別町、斜里町、清里町、小清水町、訓子府町、
		//           置戸町、佐呂間町、大空町　北海道十勝総合振興局の所管区域　北海道釧路総合振興局の所管区域　北海道根室振興局の所管区域
		[26.0, 142.0], // 座標系14: 東京都のうち北緯28度から南であり、かつ東経140度30分から東であり東経143度から西である区域
		[26.0, 127.5], // 座標系15: 沖縄県のうち東経126度から東であり、かつ東経130度から西である区域
		[26.0, 124.0], // 座標系16: 沖縄県のうち東経126度から西である区域
		[26.0, 131.0], // 座標系17: 沖縄県のうち東経130度から東である区域
		[26.0, 136.0], // 座標系18: 東京都のうち北緯28度から南であり、かつ東経140度30分から西である区域
		[26.0, 154.0] // 座標系19: 太平洋側最東端 南鳥島付近(東京都のうち北緯28度から南であり、かつ東経143度から東である区域)
	];
	/**  参照論文の変数「Sの上付線」の平面直角座標系1～19毎の原点に対応した定数。latlon2xyとxy2latlonで共通 */
	const sOverline = [0, 3652382.768270788, 3652382.768270788, 3985144.116029223, 3652382.768270788,
		3985144.116029223, 3985144.116029223, 3985144.116029223, 3985144.116029223, 3985144.116029223,
		4429086.077333566, 4873334.987359202, 4873334.987359202, 4873334.987359202, 2876546.889061122,
		2876546.889061122, 2876546.889061122, 2876546.889061122, 2212145.0174775715, 2876546.889061122
	];
	/** 参照論文の変数「Aの上付線」の平面直角座標系1～19毎の原点に対応した定数。latlon2xyとxy2latlonで共通 */
	const aOverline = [0, 6366812.400856472, 6366812.400856472, 6366812.400856472, 6366812.400856472,
		6366812.400856472, 6366812.400856472, 6366812.400856472, 6366812.400856472, 6366812.400856472,
		6366812.400856472, 6366812.400856472, 6366812.400856472, 6366812.400856472, 6366812.400856472,
		6366812.400856472, 6366812.400856472, 6366812.400856472, 6366812.400856472, 6366812.400856472
	];
	const result = [origins[sysno][0], origins[sysno][1], sOverline[sysno], aOverline[sysno]];
	return result;
}