# 線路図作成支援ツール

## 概要

折れ線を結んで路線を作成するツールです。

デプロイ先サイト→ [train-track-drawer.deno.dev](https://train-track-drawer.deno.dev/)

## 機能

* 路線管理機能
  * 路線の追加/削除/選択を行うことができます。
  * 路線名の編集を行うことができます。
* 経点管理機能
  * 路線が経由する地点の編集を行うことができます。
  * 地図上でクリックすると経点追加ができます。
  * 地図上でマーカーをドラッグすると経点移動ができます。
* 駅管理機能
  * 駅の追加/削除/選択を行うことができます。
  * 駅名/距離程の編集を行うことができます。
* データ入出力機能
  * `JSON出力`ボタンを押すと、現在編集しているデータをテキストボックスに出力します。
  * テキストボックスにデータを入力した状態で`JSON入力`を押すと、JSONファイルからデータを読み込みます。
  * **データはリロードで消えます。必ずJSON出力を行いデータの保存をするように注意してください。**

## 既知のバグ

* 駅の距離程に合わせた描画が不正確
* 路線管理機能で路線名を編集した後別路線を選択すると路線名が消える

## 使用ライブラリ

### latlonxy.js (MIT License)

> Copyright (c) 2024 FOUR 4to6

[GitHub repo](https://github.com/four4to6/latlonxy_js)