# water-use

To set up dev environment:
```
# from repo root
npm install
mkdir public
cp -rv ./node_modules/cesium/Build/Cesium/* ./public
```

To run in dev mode:
```
webpack-dev-server --progress --colors --inline -d
```

Open browser to http://localhost:8080


To deploy:
```
webpack --config ./webpack.prod.config.js --progress --profile --colors
cf push "water-use"
```

