---
layout: default
---

<center><img src="/img/books.png"></center>

## Articles

{% assign contents = site.openapi | sort:'index' %}
{% for page in contents %}
<div class="item" onclick="location.href='{{page.url}}'">
<p style="float:right" class="date">{{page.date | date: "%B %e, %Y"}}</p>
      <h3>{{page.title}}</h3>
      <p>{{page.description}}</p>
</div>
{% endfor %}
