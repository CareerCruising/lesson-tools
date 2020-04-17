# Lesson Generator

### Step 1
Generate Translation Keys based on a Lesson's file. Those keys should be placed on a spreadsheet.

```
node generator.js generate -f {template file} -m { map = path and file name without extension}
```
E.g.:
```
node generator.js generate -f ./files/lesson_1004_template.json -m ./files/mapData
node generator.js generate -f ./files/lesson_1005_template.json -m ./files/mapData
```

----

### Step 2
After the previous step, the `mapFile` should be use as source to replace all text properties with a proper Translation Key. 

```
node generator.js replace -m  {map file} -t {template file} -o {output file}
```
E.g.:
```
node generator.js replace -m ./files/mapData.json -t ./files/lesson_1004_template.json -o ../Xello.Spark.Web/src/content/lessons/lesson_1004_fr-CA.json
node generator.js replace -m ./files/mapData.json -t ./files/lesson_1005_template.json -o ./files/lesson_1005_fr-CA.json
```

----

### Step 3
Once the CVS is filled with translations, use the CSV file to replace the existing keys to the proper translation. 

```
node generator.js convert -t {translation csv file} -o {output file}
```
E.g.:
```
node generator.js convert -t ./files/mapData.tsv -o ../Xello.Spark.Web/src/content/lessons/lesson_1004_fr-CA.json
node generator.js convert -t ./files/mapData.tsv -o ./files/lesson_1005_fr-CA.json
node generator.js convert -t ./files/spanish.tsv -o ./files/lesson_1005_fr-CA.json
```
    