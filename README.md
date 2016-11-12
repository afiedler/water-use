# water-use

To deploy:
```
webpack --config ./webpack.production.config.js --progress --profile --colors
cf push "water-use"
```

To run for dev:
```
webpack-dev-server --progress --colors --inline -d
```
