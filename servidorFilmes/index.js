const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;
const bd = require('./bd')

app.use(express.json());
app.use(cors ({}))


// Requisicoes
app.get('/', (req, res) => {
    res.send('Rota inicial do servidor');
});


app.get('/filmes/:pagina', async (req, res) => {
    let pag = parseInt(req.params.pagina); 
    let Pfilme = 10; 
    let result = Pfilme * (pag - 1);
    let filmes = await bd.query('SELECT * FROM filmes ORDER BY nota DESC LIMIT ? OFFSET ?', [Pfilme, result]);
        
    return res.status(200).json(filmes);

});

app.get('/filme/:id', async (req, res) => {
    let id = parseInt(req.params.id);


        let filmeInfo = await bd.query(`
        SELECT
            filmes.id,
            filmes.titulo AS filme_titulo,
            GROUP_CONCAT(DISTINCT generos.titulo) AS generos,
            GROUP_CONCAT(DISTINCT atores.titulo) AS atores
        FROM filmes
        INNER JOIN filmes_generos ON filmes.id = filmes_generos.filme_id
        INNER JOIN generos ON filmes_generos.genero_id = generos.id
        INNER JOIN atores_filmes ON filmes.id = atores_filmes.filme_id
        INNER JOIN atores ON atores_filmes.ator_id = atores.id
        WHERE filmes.id = ?
    `, [id]);



        return res.status(200).json(filmeInfo);

});

app.get('/filmes/busca/:palavra', async (req, res) => {
    let palavra = req.params.palavra;

 
        let filmes = await bd.query(`
        SELECT filmes.*, generos.titulo AS genero
        FROM filmes
        INNER JOIN filmes_generos ON filmes.id = filmes_generos.filme_id
        INNER JOIN generos ON filmes_generos.genero_id = generos.id
        WHERE filmes.titulo LIKE ?;
    `, [`%${palavra}%`]);


        return res.status(200).json(filmes);
    
});

app.get('/generos/:genero', async (req, res) => {
    let genero = req.params.genero;

        let filmes = await bd.query(`
            SELECT filmes.titulo
            FROM filmes
            INNER JOIN filmes_generos ON filmes.id = filmes_generos.filme_id
            INNER JOIN generos ON filmes_generos.genero_id = generos.id
            WHERE generos.titulo = ?;
        `, [genero]);

        let titulosFilmes = filmes.map((filme) => filme.titulo);

        return res.status(200).json(titulosFilmes);
    
});

app.get('/ator/:id', async (req, res) => {
    let atorId = parseInt(req.params.id);


        let atorInfo = await bd.query(`
            SELECT atores.titulo AS nome_ator, filmes.titulo AS nome_filme
            FROM atores
            INNER JOIN atores_filmes ON atores.id = atores_filmes.ator_id
            INNER JOIN filmes ON atores_filmes.filme_id = filmes.id
            WHERE atores.id = ?;
        `, [atorId]);


        let nomeAtor = atorInfo[0];

        let filmesParticipados = atorInfo.map((filme) => filme.nome_filme);

        return res.status(200).json({ nome_ator: nomeAtor, filmes_participados: filmesParticipados });
    
});

app.get('/atores/busca/:palavra', async (req, res) => {
    let palavra = req.params.palavra;

        let atores = await bd.query(`
            SELECT atores.id, atores.titulo AS nome_ator, filmes.titulo AS nome_filme
            FROM atores
            INNER JOIN atores_filmes ON atores.id = atores_filmes.ator_id
            INNER JOIN filmes ON atores_filmes.filme_id = filmes.id
            WHERE atores.titulo LIKE ?;
        `, [`%${palavra}%`]);


        let result = {};

        atores.forEach((ator) => {
            if (!result[ator.id]) {
                result[ator.id] = {
                    ator: ator.nome_ator,
                    filmes: [],
                };
            }
            result[ator.id].filmes.push(ator.nome_filme);
        });


        let lista = Object.values(result);
        return res.status(200).json(lista);
   
});



app.post('/atores', async (req, res) => {
    let { nome } = req.body;

        let modif = await bd.query('INSERT INTO atores (titulo) VALUES (?)', [nome]);

        if (modif.affectedRows === 1) {

            let AtorCriado = await bd.query('SELECT * FROM atores WHERE id = ?', [modif.insertId]);

            return res.status(201).json(AtorCriado[0]);
        } else {
            return res.status(500).json({ error: 'Erro! Nao foi possivel criar o ator' });
        }

});

app.put('/atores/:id', async (req, res) => {
    let id = parseInt(req.params.id);
    let { nome } = req.body;


        let modif = await bd.query('UPDATE atores SET titulo = ? WHERE id = ?', [nome, id]);

        if (modif.affectedRows === 1) {
            let nomeAtt = await bd.query('SELECT * FROM atores WHERE id = ?', [id]);

            return res.status(200).json(nomeAtt[0]);
        } else {
            return res.status(500).json({ error: 'Erro! Nao foi possivel atualizar o ator'  });
        }
   
});

app.delete('/atores/:id', async (req, res) => {
    let id = parseInt(req.params.id); 

        await bd.query('DELETE FROM atores_filmes WHERE ator_id = ?', [id]);

        await bd.query('DELETE FROM atores WHERE id = ?', [id]);

        return res.status(200).json({ id: id });
   
});

app.post('/participacoes/:idAtor/:idFilme', async (req, res) => {
    let idAtor = parseInt(req.params.idAtor);
    let idFilme = parseInt(req.params.idFilme);


        let modif = await bd.query('INSERT INTO atores_filmes (ator_id, filme_id) VALUES (?, ?)', [idAtor, idFilme]);

        if (modif.affectedRows === 1) {

            return res.status(201).json({ idTabela: modif.insertId });
        } else {
            return res.status(500).json({ error: 'Erro ao cadastrar a participação' });
        }

});

app.delete('/participacoes/:idAtor/:idFilme', async (req, res) => {
    let idAtor = parseInt(req.params.idAtor);
    let idFilme = parseInt(req.params.idFilme);


        let modif = await bd.query('DELETE FROM atores_filmes WHERE ator_id = ? AND filme_id = ?', [idAtor, idFilme]);
        

        if (modif.affectedRows === 1) {

            return res.status(500).json({ error: 'Removido' });
        } else {
            return res.status(500).json({ error: 'Nao foi possivel remover' });
        }

});





// Subindo o servidor na porta de terminada
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
}); 

