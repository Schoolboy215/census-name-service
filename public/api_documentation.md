# API Documentation
- Base endpoint is /api
- Due to limitations in the source data, filters apply to first and last names separately
    - sex, yob, and state only apply to first names
    - race only applies to last names
- All fields are optional and will default to wide open
    - This means percentile will be 100 and top will be true

## Generate a first name
POST `/firstName`
### **Body** `multipart/form-data, application/x-www-form-urlencoded, application/json`
|Field      |Type   |Notes              |Accepted values|
|:-         |:-     |:-                 |:-             |
|sex        |text   |                   |"M", "F"       |
|yob        |number |Year of birth      |1910-2023      |
|state      |text   |                   |"AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"|
|percentile |number |*see note at end   |1-100          |
|top        |text   |*see note at end   |"true", "false"|
### **Response**
`application/json`
|Field      |Type   |
|:-         |:-     |
|firstName  |text   |
### **Example body**
Returns a random first name for a male born in 1970 in Oklahoma
```
{
    "sex" : "M",
    "yob" : 1970,
    "state" : "OK"
}
```
### **Example response**
```
{
    "firstName": "MARK"
}
```

## Generate a last name
POST `/lastName`
### **Body** `multipart/form-data, application/x-www-form-urlencoded, application/json`
|Field      |Type   |Notes              |Accepted values|
|:-         |:-     |:-                 |:-             |
|race       |text   |                   |"white", "black", "asian", "native", "hispanic"|
|percentile |number |*see note at end   |1-100          |
|top        |text   |*see note at end   |"true", "false"|
### **Response**
`application/json`
|Field      |Type   |
|:-         |:-     |
|lastName   |text   |
### **Example body**
Returns a random last name for a white individual
```
{
    "race" : "white"
}
```
### **Example response**
```
{
    "lastName": "HARRISON"
}
```

## Generate a full name
POST `/fullName`
### **Body** `multipart/form-data, application/x-www-form-urlencoded, application/json`
|Field      |Type   |Notes              |Accepted values|
|:-         |:-     |:-                 |:-             |
|sex        |text   |                   |"M", "F"       |
|yob        |number |Year of birth      |1910-2023      |
|state      |text   |                   |"AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"|
|race       |text   |                   |"white", "black", "asian", "native", "hispanic"|
|percentile |number |*see note at end   |1-100          |
|top        |text   |*see note at end   |"true", "false"|
### **Response**
`application/json`
|Field      |Type   |
|:-         |:-     |
|lastName   |text   |
### **Example body**
Returns a random last name for a white male, born in 1970, in Oklahoma
```
{
    "sex" : "M",
    "yob" : 1970,
    "state" : "OK",
    "race" : "white"
}
```
### **Example response**
```
{
    "firstName": "KEVIN",
    "lastName": "WEISMAN"
}
```

# Notes
## Percentile and top
Percentile represents how much of the distribution to use, and top represents whether this distribution is at the most common end (true) or least common end (false). To put it into simple terms with an example, requesting `top="true", percentile=20` is equivalent to asking for a name that is in the top 20% most common names.

