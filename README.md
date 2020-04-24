# Lesson Tools

Tool to convert and generate translations for lessons.

### Step 1
Generate Translation Keys based on a Lesson's file. Those keys should be placed on a spreadsheet.

```
node generator.js generate -f {template file} -m { map = path and file name without extension}
```
E.g.:
```
node generator.js generate -f ./files/lesson_1004
```

----

### Step 2
Sanitize TSV.

E.g.:
```
node generator.js sanitize -f ./files/translations
```

----

### Step 3
Once the CVS is filled with translations, use the CSV file to replace the existing keys to the proper translation. 

E.g.:
```
node generator.js convert -t ./files/translations.tsv -f ./files/lesson_1004 -o ./files/lesson_1004
```


----

#### Collaborators
| Team Member | E-mail | Team |
|---|---|---|
| Fabricio Biron | fabriciob@xello.world | Spark |
| Jonatas Melo | jonatasm@xello.world | Spark |
| Lily Beaul | lilyb@xello.world | Spark |
| Wesley Francis | wesleyf@careercruising.com | Xedi |

----