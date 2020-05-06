# Model registry

# Data in the DOM

## Editor element

Each model is represented inside a div.

That div:

* Must have an ID equal to the `model local name`
* Must have in the associated data set the key `model_local_name` 
* Must have the class `editor`

## Node element

Certain HTML elements will represent MPS nodes. These elements:

* Must have in the associated data set the key `represented_node`

## Reference element